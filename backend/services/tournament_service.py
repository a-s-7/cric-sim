import os
from pymongo import MongoClient
from bson import ObjectId
from collections import defaultdict
from utils import get_tournament_standings, confirmTeamsForStage, decide_playoff_no_result

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

def get_tournaments_info(group_results, category):
    query = {}
    if category != "all":
        query["category"] = category

    # Fetch all tournaments within the category to pair real-world and what-if modes
    tournaments = list(tournaments_collection.find(query).sort("startDate", -1))

    paired = {}

    for tournament in tournaments:
        key = (tournament["name"], tournament["edition"])

        if key not in paired:
            paired[key] = {
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

    # # If grouped results are requested, organize by franchise (acronym) or format
    # if group_results:
    #     output = {}
    #     for item in paired.values():
    #         if category == "franchise":
    #             group_key = item.get("acronym", "Other")
    #         else:
    #             group_key = item.get("format", "Other")
            
    #         if group_key not in output:
    #             output[group_key] = []
    #         output[group_key].append(item)
    # else:
    
    output = list(paired.values())

    return {"tournaments": output, "grouped": group_results}

def get_tournaments_teams(id):
    teams = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        raise ValueError('Tournament not found')
    
    
    teams = list(stageTeams_collection.aggregate([
        {
            "$match": {
                "tournamentId": id,
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
                "value": { "$toString": "$team._id" },
                "label": "$team.name"
            }
        },
        {
            "$sort": {
                "label": 1
            }
        }
    ]))

    if not teams:
        raise ValueError('Teams not found')        

    return teams

def get_tournaments_venues(id):
    venues = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        raise ValueError('Tournament not found')
    
    
    venues = list(matches_collection.aggregate([
        {
            "$match": {
                "tournamentId": id
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
                "_id": "$venue.stadium"
            }
        },
        {
            "$project": {
                "_id": 0,
                "label": "$_id",
                "value": "$_id"
            }
        },
        {
            "$sort": {
                "label": 1
            }
        }
    ]))

    if not venues:
        raise ValueError('Venues not found')        

    return venues

def get_tournaments_groups(id):
    groups = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        raise ValueError('Tournament not found')
    
    
    groups = list(matches_collection.aggregate([
        {
            "$match": {
                "tournamentId": id,
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
                "label": "$_id",
                "value": "$_id"
            }
        },
        {
            "$sort": {
                "label": 1
            }
        }
    ]))

    if not groups:
        raise ValueError('Groups not found')        

    return groups

def get_tournaments_stages(id, onlyActiveStages):
    stages = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        raise ValueError('Tournament not found')

        

    filter = {"tournamentId": id}

    if onlyActiveStages:
        filter["status"] = "active"
    
    stages = list(stages_collection.find(
        filter,
        {"_id": 0, "label": "$name", "value": "$order"}
    ))

    if not stages:
        raise ValueError('Stages not found')        

    return stages

def get_tournaments_standings_data(id):
    groupStageOrders = stages_collection.find({"tournamentId": id, "type": "group"})
    groupStageOrders = [s["order"] for s in groupStageOrders]

    return get_tournament_standings(id, groupStageOrders)

def get_tournaments_match_data(id, groups, teams, venues, stages):
    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        raise ValueError('Tournament not found')

    teams_pipeline = [
    { "$match": { "tournamentId": id } },

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
            "acronym": "$team._id",
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

    teams_data = list(stageTeams_collection.aggregate(teams_pipeline))

    groups = groups.split(",") if groups else []
    teams = teams.split(",") if teams else []
    venues = venues.split(",") if venues else []
    stages = [int(stage) for stage in stages.split(",")] if stages else []

    pipeline = [
        { "$match": {"tournamentId": id} },
        {"$lookup": {
            "from": "venues",
            "localField": "venueId",
            "foreignField": "_id",
            "as": "venue"
        }},
        {"$unwind": "$venue"},
        {
            "$set": {
                "venue": "$venue.stadium",
                "city": "$venue.city"
            }
        },
        {"$lookup": {
            "from": "stageTeams",
            "localField": "homeStageTeamId",
            "foreignField": "_id",
            "as": "homeStageTeam"
        }},
        {
            "$unwind": {
                "path": "$homeStageTeam",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$set": {
                "homeStageTeam": "$homeStageTeam.teamId",
                "homeConfirmed": "$homeStageTeam.confirmed",
                "homeSeed": "$homeStageTeam.seed"
            }
        },
        {"$lookup": {
            "from": "stageTeams",
            "localField": "awayStageTeamId",
            "foreignField": "_id",
            "as": "awayStageTeam"
        }},
        {
            "$unwind": {
                "path": "$awayStageTeam",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$set": {
                "awayStageTeam": "$awayStageTeam.teamId",
                "awayConfirmed": "$awayStageTeam.confirmed",
                "awaySeed": "$awayStageTeam.seed"
            }
        },
        {"$lookup": {
            "from": "stages",
            "localField": "stageId",
            "foreignField": "_id",
            "as": "stage"
        }},
        {"$unwind": "$stage"},
        {
            "$set": {
                "stage": "$stage.name",
                "stageOrder": "$stage.order",
                "stageStatus": "$stage.status"
            }
        },
        {
            "$project": {
                "_id": 0,
                "tournamentId": 0,
                "homeStageTeamId": 0,
                "awayStageTeamId": 0,
                "venueId": 0,
                "stageId": 0,
            }
        }
    ]

    or_condition = {
            "$or": [
            ]
        }

    if groups:
        or_condition["$or"].append({"group": { "$in": groups }})

    if teams:
        or_condition["$or"].append({"homeStageTeam": { "$in": teams }})
        or_condition["$or"].append({"awayStageTeam": { "$in": teams }})

    if venues:
        or_condition["$or"].append({"venue": { "$in": venues }})

    if stages:
        or_condition["$or"].append({"stageOrder": { "$in": stages }})

    if or_condition["$or"]:
        pipeline.append({"$match": or_condition})

    pipeline.append({"$sort": {"matchNumber": 1}})
        
    filtered_matches = list(matches_collection.aggregate(pipeline))

    final_match = matches_collection.find({"tournamentId": id}).sort("matchNumber", -1).limit(1)[0]
    
    winner = ""
    if final_match["result"] != "None":
        # Determine final winner

        if final_match["result"] == "Home-win":
            winner = stageTeams_collection.find_one({"_id": ObjectId(final_match["homeStageTeamId"])})["teamId"]
        elif final_match["result"] == "No-result":

            # If final is no result in a franchise tournament, determine winner based on league standings (Higher-seeded team is champion)
            if tournament["category"] == "franchise":
                last_stage = stages_collection.find({"tournamentId": id}).sort("order", -1).limit(1)[0]
                standings = get_tournament_standings(id, [last_stage["order"] - 1])
                standingsGroup = standings["standings"][0]["groups"]["LEAGUE"]

                winner = decide_playoff_no_result(final_match, True, standingsGroup)["teamId"]    
            else:
                winner1 = stageTeams_collection.find_one({"_id": ObjectId(final_match["homeStageTeamId"])})["teamId"]
                winner2 = stageTeams_collection.find_one({"_id": ObjectId(final_match["awayStageTeamId"])})["teamId"]

                winner = winner1 + "#" + winner2

        else:
            winner = stageTeams_collection.find_one({"_id": ObjectId(final_match["awayStageTeamId"])})["teamId"]

    return {"teams": teams_data, "matches": filtered_matches, "winner": winner, "format": tournament["format"], "category": tournament["category"]}
    


