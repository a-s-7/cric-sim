import os
from pymongo import MongoClient
from utils import (
    get_tournament_standings_data,
    find_tournament,
    get_tournament_teams_data,
    parse_filter_params,
    build_or_filter_condition,
    build_common_match_lookup_stages,
    determine_final_winner,
)

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
        return get_tournament_match_data(tournament, groups, teams, venues, stages, is_wtc = True)
    else:
        return get_tournament_match_data(tournament, groups, teams, venues, stages)
    
def get_tournament_match_data(tournament, groups=None, teams=None, venues=None, stages=None, is_wtc=False):
    teams_data = get_tournament_teams_data(tournament)
    groups, teams, venues, stages = parse_filter_params(groups, teams, venues, stages)

    pipeline = [{"$match": {"tournamentId": tournament["_id"]}}]

    if is_wtc:
        pipeline.append({"$lookup": {
            "from": "series",
            "localField": "seriesId",
            "foreignField": "_id",
            "as": "series"
        }})
        pipeline.append({"$unwind": {"path": "$series", "preserveNullAndEmptyArrays": True}})
        pipeline.append({"$set": {"series": "$series.name"}})

    pipeline.extend(build_common_match_lookup_stages())

    project_stage = {
        "_id": 0,
        "tournamentId": 0,
        "homeStageTeamId": 0,
        "awayStageTeamId": 0,
        "homeTeam": 0,
        "awayTeam": 0,
        "venueId": 0,
        "stageId": 0,
    }

    if is_wtc:
        project_stage["seriesId"] = 0

    pipeline.append({"$project": project_stage})

    filter_groups = [] if is_wtc else groups

    or_condition = build_or_filter_condition(filter_groups, teams, venues, stages)
    
    if or_condition["$or"]:
        pipeline.append({"$match": or_condition})

    sort_field = "date" if is_wtc else "matchNumber"

    pipeline.append({"$sort": {sort_field: 1}})

    filtered_matches = list(matches_collection.aggregate(pipeline))

    final_match = (
        matches_collection.find({"tournamentId": tournament["_id"]})
        .sort(sort_field, -1)
        .limit(1)[0]
    )

    winner = determine_final_winner(tournament, final_match)

    result = {
        "teams": teams_data,
        "matches": filtered_matches,
        "winner": winner,
        "format": tournament["format"],
        "category": tournament["category"],
    }
    if not is_wtc:
        result["ballsPerInnings"] = tournament["ballsPerInnings"]

    return result

def get_tournament_standings(tournament_id):
    return get_tournament_standings_data(tournament_id, None, allGroupStages = True)
