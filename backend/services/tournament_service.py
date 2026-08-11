import os
from pymongo import MongoClient
from bson import ObjectId
from collections import defaultdict
from utils import get_tournament_standings, confirmTeamsForStage, decide_playoff_no_result
from flask import abort

verbose = True

if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')
client = MongoClient(connection_string)
db = client['events']

tournaments_collection = db['tournaments']
stageTeams_collection = db['stageTeams']
matches_collection = db['matches']
stages_collection = db["stages"]
teams_collection = db['teams']

def find_tournament(tournament_id):
    tournament = tournaments_collection.find_one({"_id": tournament_id})

    if tournament is None:
        abort(404, description=f"Tournament not found")

    return tournament

def get_tournaments_info(group_results, category, division):
    query = {}
    if category != "all":
        query["category"] = category
    if division != "all":
        query["division"] = division

    # Fetch all tournaments within the category to pair real-world and what-if modes
    tournaments = list(tournaments_collection.find(query).sort("startDate", -1))

    paired = {}

    for tournament in tournaments:
        # Group by the base _id (stripping off -rw and -ps suffixes) 
        base_id = str(tournament["_id"])
        key = base_id[:-3]

        if key not in paired:
            paired[key] = {
                "id": key,
                "rw_id": None,
                "ps_id": None,
                "format": tournament["format"],
                "name": tournament["name"],
                "edition": tournament["edition"],
                "startDate": tournament["startDate"].isoformat(),
                "endDate": tournament["endDate"].isoformat(),
                "structure": tournament["structure"],
                "gradient": tournament["gradient"],
                "mainLogo": tournament["mainLogo"],
                "horizontalLogo": tournament["horizontalLogo"],
                "pointsTableColor": tournament["pointsTableColor"],
                "tileBackgroundColor": tournament["tileBackgroundColor"],
                "category": tournament["category"],
            }
        
        if tournament.get("mode") == "real-world":
            paired[key]["rw_id"] = str(tournament["_id"])
        else:
            paired[key]["ps_id"] = str(tournament["_id"])
    
    output = list(paired.values())

    return {"tournaments": output, "grouped": group_results}

def get_tournament_teams(tournament_id):
    find_tournament(tournament_id)
    
    teams = list(stageTeams_collection.aggregate([
        {
            "$match": {
                "tournamentId": tournament_id,
                "confirmed": { "$exists": False }
            }
        },
        {
            "$lookup": {
                "from": "teams",
                "localField": "teamId",
                "foreignField": "_id",
                "as": "team"
            }
        },
        {
            "$unwind": "$team"
        },
        {
            "$project": {
                "_id": 0,
                "name": "$team.name",
                "id": { "$toString": "$team._id" }
            }
        },
        {
            "$sort": {
                "name": 1
            }
        }
    ]))

    return teams

def get_tournament_venues(tournament_id):
    find_tournament(tournament_id)
    
    venues = list(matches_collection.aggregate([
        {
            "$match": {
                "tournamentId": tournament_id
            }
        },
        {
            "$lookup": {
                "from": "venues",
                "localField": "venueId",
                "foreignField": "_id",
                "as": "venue"
            }
        },
        {
            "$unwind": "$venue"
        },
        {
            "$group": {
                "_id": "$venue._id",
                "stadium": {"$first": "$venue.stadium"},
                "city": {"$first": "$venue.city"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "stadium": 1,
                "city": 1
            }
        },
        {
            "$sort": {
                "stadium": 1
            }
        }
    ]))

    return venues

def get_tournament_groups(tournament_id):
    find_tournament(tournament_id)
    
    groups = list(matches_collection.aggregate([
        {
            "$match": {
                "tournamentId": tournament_id,
                "group": { "$exists": True}
            }
        },
        {
            "$group": {
                "_id": "$group"
            }
        },
        {
            "$project": {
                "_id": 0,
                "name": "$_id",
            }
        },
        {
            "$sort": {
                "name": 1
            }
        }
    ]))

    return groups

def get_tournament_stages(tournament_id, onlyActiveStages):
    find_tournament(tournament_id)

    filter = {"tournamentId": tournament_id}

    if onlyActiveStages:
        filter["status"] = "active"
    
    stages = list(stages_collection.find(
        filter,
        {"_id": 0, "name": "$name", "order": "$order"}
    ))    

    return stages

def get_tournament_matches(tournament_id, groups, teams, venues, stages):
    tournament = find_tournament(tournament_id)

    if tournament["name"] == "ICC World Test Championship":
        return get_wtc_match_data(tournament, teams, venues, stages)
    else:
        return get_tournament_match_data(tournament, groups, teams, venues, stages)
    
def get_tournament_match_data(tournament, groups, teams, venues, stages):
    teams_data = get_tournament_match_teams_data(tournament)
    groups, teams, venues, stages = parse_filter_params(groups, teams, venues, stages)

    pipeline = [{"$match": {"tournamentId": tournament["_id"]}}]
    pipeline.extend(build_common_match_lookup_stages())
    pipeline.append({
        "$project": {
            "_id": 0,
            "tournamentId": 0,
            "homeStageTeamId": 0,
            "awayStageTeamId": 0,
            "homeTeam": 0,
            "awayTeam": 0,
            "venueId": 0,
            "stageId": 0,
        }
    })

    or_condition = build_or_filter_condition(groups, teams, venues, stages)
    if or_condition["$or"]:
        pipeline.append({"$match": or_condition})

    pipeline.append({"$sort": {"matchNumber": 1}})
        
    filtered_matches = list(matches_collection.aggregate(pipeline))

    final_match = matches_collection.find({"tournamentId": tournament["_id"]}).sort("matchNumber", -1).limit(1)[0]
    
    winner = determine_final_winner(tournament, final_match)

    return {"teams": teams_data, "matches": filtered_matches, "winner": winner, "format": tournament["format"], "category": tournament["category"], "ballsPerInnings": tournament["ballsPerInnings"]}

def get_wtc_match_data(tournament, teams, venues, stages):
    teams_data = get_tournament_match_teams_data(tournament)
    _, teams, venues, stages = parse_filter_params(None, teams, venues, stages)

    pipeline = [{"$match": {"tournamentId": tournament["_id"]}}]
    pipeline.append({"$lookup": {
        "from": "series",
        "localField": "seriesId",
        "foreignField": "_id",
        "as": "series"
    }})
    pipeline.append({"$unwind": {"path": "$series", "preserveNullAndEmptyArrays": True}})
    pipeline.append({"$set": {"series": "$series.name"}})
    pipeline.extend(build_common_match_lookup_stages())
    pipeline.append({
        "$project": {
            "_id": 0,
            "tournamentId": 0,
            "homeStageTeamId": 0,
            "awayStageTeamId": 0,
            "homeTeam": 0,
            "awayTeam": 0,
            "venueId": 0,
            "stageId": 0,
            "seriesId": 0,
        }
    })

    or_condition = build_or_filter_condition([], teams, venues, stages)
    if or_condition["$or"]:
        pipeline.append({"$match": or_condition})

    pipeline.append({"$sort": {"date": 1}})
        
    filtered_matches = list(matches_collection.aggregate(pipeline))

    final_match = matches_collection.find({"tournamentId": tournament["_id"]}).sort("date", -1).limit(1)[0]
    
    winner = determine_final_winner(tournament, final_match)

    return {"teams": teams_data, "matches": filtered_matches, "winner": winner, "format": tournament["format"], "category": tournament["category"]}

def get_tournaments_standings_data(id):
    groupStageOrders = stages_collection.find({"tournamentId": id, "type": "group"})
    groupStageOrders = [s["order"] for s in groupStageOrders]

    return get_tournament_standings(id, groupStageOrders)

# Helpers

def get_tournament_match_teams_data(tournament):
    teams_pipeline = [
            { "$match": { "tournamentId": tournament["_id"] } },
            {
                "$lookup": {
                    "from": "teams",
                    "localField": "teamId",
                    "foreignField": "_id",
                    "as": "team"
                }
            },
            { "$unwind": "$team" },
            {
                "$project": {
                    "_id": 0,
                    "acronym": "$team.acronym",
                    "gradient": "$team.gradient",
                    "name": "$team.name",
                    "logo": "$team.logo"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "teams": { 
                        "$push": {
                            "k": "$acronym",
                            "v": { "gradient": "$gradient", "logo": "$logo", "name": "$name" }
                        }
                    }
                }
            },
            {
                "$replaceRoot": { "newRoot": { "$arrayToObject": "$teams" } }
            }
        ]
    
    return list(stageTeams_collection.aggregate(teams_pipeline))

def resolve_team_acronym(stage_team_id):
    stage_team = stageTeams_collection.find_one({"_id": ObjectId(stage_team_id)})
    team = teams_collection.find_one({"_id": stage_team["teamId"]})
    return team["acronym"]

def parse_filter_params(groups, teams, venues, stages):
    """Split comma-separated filter query params into lists."""
    groups_list = groups.split(",") if groups else []
    teams_list = teams.split(",") if teams else []
    venues_list = venues.split(",") if venues else []

    stages_list = []
    if stages:
        for stage in stages.split(","):
            stages_list.append(int(stage))

    return groups_list, teams_list, venues_list, stages_list

def build_or_filter_condition(groups, teams, venues, stages):
    """Build the shared $or filter condition used by both match pipelines."""
    or_condition = {"$or": []}

    if groups:
        or_condition["$or"].append({"group": {"$in": groups}})

    if teams:
        or_condition["$or"].append({"homeTeamId": {"$in": teams}})
        or_condition["$or"].append({"awayTeamId": {"$in": teams}})

    if venues:
        or_condition["$or"].append({"venue": {"$in": venues}})

    if stages:
        or_condition["$or"].append({"stageOrder": {"$in": stages}})

    return or_condition
    
def build_common_match_lookup_stages():
    """Venue, home team, away team, and stage lookups shared by all match pipelines."""
    stages = []
    stages.append({"$lookup": {
        "from": "venues",
        "localField": "venueId",
        "foreignField": "_id",
        "as": "venue"
    }})
    stages.append({"$unwind": "$venue"})
    stages.append({"$set": {"venue": "$venue.stadium", "city": "$venue.city"}})

    for side in ("home", "away"):
        stages.append({"$lookup": {
            "from": "stageTeams",
            "localField": f"{side}StageTeamId",
            "foreignField": "_id",
            "as": f"{side}StageTeam"
        }})
        stages.append({"$unwind": {"path": f"${side}StageTeam", "preserveNullAndEmptyArrays": True}})
        stages.append({"$lookup": {
            "from": "teams",
            "localField": f"{side}StageTeam.teamId",
            "foreignField": "_id",
            "as": f"{side}Team"
        }})
        stages.append({"$unwind": {"path": f"${side}Team", "preserveNullAndEmptyArrays": True}})
        stages.append({"$set": {
            f"{side}StageTeam": f"${side}Team.acronym",
            f"{side}TeamId": f"${side}Team._id",
            f"{side}Confirmed": f"${side}StageTeam.confirmed",
            f"{side}Seed": f"${side}StageTeam.seed"
        }})

    stages.append({"$lookup": {
        "from": "stages",
        "localField": "stageId",
        "foreignField": "_id",
        "as": "stage"
    }})
    stages.append({"$unwind": "$stage"})
    stages.append({"$set": {
        "stage": "$stage.name",
        "stageOrder": "$stage.order",
        "stageStatus": "$stage.status"
    }})
    return stages

def determine_final_winner(tournament, final_match):
    """Determine the acronym (or acronym#acronym for a shared/undecided result)
    of the final match's winner, given the tournament's result conventions."""
    if final_match["result"] == "None":
        return ""

    if final_match["result"] == "Home-win":
        return resolve_team_acronym(final_match["homeStageTeamId"])

    if final_match["result"] in ("No-result", "Draw"):
        # Franchise tournaments resolve an undecided final via league standings
        # (higher-seeded team is champion). Everything else (WTC draws, non-franchise
        # no-results) is reported as a shared/undecided result between both teams.
        if tournament["category"] == "franchise":
            last_stage = stages_collection.find({"tournamentId": tournament["_id"]}).sort("order", -1).limit(1)[0]
            standings = get_tournament_standings(tournament["_id"], [last_stage["order"] - 1])
            standingsGroup = standings["standings"][0]["groups"]["LEAGUE"]

            decided_team_id = decide_playoff_no_result(final_match, True, standingsGroup)["teamId"]
            return teams_collection.find_one({"_id": decided_team_id})["acronym"]

        winner1 = resolve_team_acronym(final_match["homeStageTeamId"])
        winner2 = resolve_team_acronym(final_match["awayStageTeamId"])
        return winner1 + "#" + winner2

    # Away-win
    return resolve_team_acronym(final_match["awayStageTeamId"])
