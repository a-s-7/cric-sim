import os
from datetime import datetime, timedelta
import random

from flask import Blueprint, jsonify, request
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from data.utils.tournamentsUtils import overs_to_balls
from collections import defaultdict
from utils import get_tournament_standings, confirmTeamsForStage

verbose = True

if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')

# Connect with MongoDB
client = MongoClient(connection_string)
db = client['events']

tournaments_collection = db['tournaments']
stageTeams_collection = db['stageTeams']
teams_collection = db['teams']
matches_collection = db['matches']
stages_collection = db["stages"]

events_bp = Blueprint('events_bp', __name__)

@events_bp.route('/tournaments', methods=['GET'])
def get_tournaments_info():
    group_results = request.args.get('grouped', 'true').lower() == 'true'
    
    output = [] if not group_results else {}

    for tournament in tournaments_collection.find():
        t_data = {"id": str(tournament["_id"]),
                  "format": tournament["format"],
                  "name": tournament["name"],
                  "edition": tournament["edition"],
                  "status": tournament["status"],
                  "startDate": tournament["startDate"].isoformat(),
                  "endDate": tournament["endDate"].isoformat(),
                  "currentStageId": tournament["currentStageId"],
                  "gradient": tournament["gradient"],
                  "mainLogo": tournament["mainLogo"],
                  "horizontalLogo": tournament["horizontalLogo"],
                  "pointsTableColor": tournament["pointsTableColor"]}
        
        if group_results:
            fmt = tournament["format"]
            if fmt not in output:
                output[fmt] = []
            output[fmt].append(t_data)
        else:
            output.append(t_data)
    
    return jsonify(output)

@events_bp.route('/tournaments/<string:id>/teams', methods=['GET'])
def get_tournaments_teams(id):
    teams = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404
    
    
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
        return jsonify({"error": "Teams not found"}), 404        

    return jsonify(teams)

@events_bp.route('/tournaments/<string:id>/venues', methods=['GET'])
def get_tournaments_venues(id):
    venues = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404
    
    
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
        return jsonify({"error": "Venues not found"}), 404        

    return jsonify(venues)

@events_bp.route('/tournaments/<string:id>/groups', methods=['GET'])
def get_tournaments_groups(id):
    groups = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404
    
    
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
        return jsonify({"error": "Groups not found"}), 404        

    return jsonify(groups)

@events_bp.route('/tournaments/<string:id>/stages', methods=['GET'])
def get_tournaments_stages(id):
    stages = []

    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404

    onlyActiveStages = request.args.get("onlyActiveStages", "")    

    filter = {"tournamentId": id}

    if onlyActiveStages:
        filter["status"] = "active"
    
    stages = list(stages_collection.find(
        filter,
        {"_id": 0, "label": "$name", "value": "$order"}
    ))

    if not stages:
        return jsonify({"error": "Stages not found"}), 404        

    return jsonify(stages)

@events_bp.route('/tournaments/<string:id>/standings', methods=['GET'])
def get_tournaments_standings(id):
    groupStageOrders = stages_collection.find({"tournamentId": id, "type": "group"})
    groupStageOrders = [s["order"] for s in groupStageOrders]

    return jsonify(get_tournament_standings(id, groupStageOrders))

@events_bp.route('/tournaments/<string:id>/matches', methods=['GET'])
def get_tournaments_match_data(id):
    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404

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
            "logo": "$team.flag"
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

    groups = request.args.get("groups", "")
    teams = request.args.get("teams", "")
    venues = request.args.get("venues", "")
    stages = request.args.get("stages", "")

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
                "venue": "$venue.stadium"
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

    final_match = matches_collection.find().sort("matchNumber", -1).limit(1)[0]
    
    winner = ""
    if final_match["result"] != "None":
        if final_match["result"] == "Home-win":
            winner = stageTeams_collection.find_one({"_id": ObjectId(final_match["homeStageTeamId"])})["teamId"]
        else:
            winner = stageTeams_collection.find_one({"_id": ObjectId(final_match["awayStageTeamId"])})["teamId"]

    return jsonify({"teams": teams_data, "matches": filtered_matches, "winner": winner})

@events_bp.route('/tournaments/<string:id>/match/<int:match_num>/<string:result>', methods=['PATCH'])
def update_tournament_match_result(id, match_num, result):
    if result not in ["Home-win", "Away-win", "No-result"]:
        return jsonify({"error": "Invalid result value"}), 400

    try:
        match = matches_collection.find_one({"tournamentId": id, "matchNumber": match_num}) 
        matchStage = stages_collection.find_one({"_id": ObjectId(match["stageId"])})

        if matchStage["type"] == "group":
            if match["result"] == "Home-win":
                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["homeStageTeamId"])},
                    {"$inc": {"won": -1, "points": -2, "matchesPlayed": -1}}
                )

                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["awayStageTeamId"])},
                    {"$inc": {"lost": -1, "matchesPlayed": -1}}
                )

            elif match["result"] == "Away-win":
                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["awayStageTeamId"])},
                    {"$inc": {"won": -1, "points": -2, "matchesPlayed": -1}}
                )

                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["homeStageTeamId"])},
                    {"$inc": {"lost": -1, "matchesPlayed": -1}}
                )

            elif match["result"] == "No-result":
                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["homeStageTeamId"])},
                    {"$inc": {"matchesPlayed": -1, "points": -1, "noResult": -1}}
                )

                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["awayStageTeamId"])},
                    {"$inc": {"matchesPlayed": -1, "points": -1, "noResult": -1}}
                )

            if result == "Home-win":
                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["homeStageTeamId"])},
                    {"$inc": {"won": 1, "points": 2, "matchesPlayed": 1}}
                )

                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["awayStageTeamId"])},
                    {"$inc": {"lost": 1, "matchesPlayed": 1}}
                )

            elif result == "Away-win":
                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["awayStageTeamId"])},
                    {"$inc": {"won": 1, "points": 2, "matchesPlayed": 1}}
                )

                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["homeStageTeamId"])},
                    {"$inc": {"lost": 1, "matchesPlayed": 1}}
                )
            
            elif result == "No-result":
                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["homeStageTeamId"])},
                    {"$inc": {"matchesPlayed": 1, "points": 1, "noResult": 1}}
                )

                stageTeams_collection.update_one(
                    {"_id": ObjectId(match["awayStageTeamId"])},
                    {"$inc": {"matchesPlayed": 1, "points": 1, "noResult": 1}}
                )
    
        update_result = matches_collection.update_one(
            {"tournamentId": id, "matchNumber": match_num},
            {"$set": {"result": result}},
        )

        if update_result.matched_count == 0:
            raise ValueError("No match was found")

        not_finished_matches = list(matches_collection.find({
            "tournamentId": id,
            "stageId": ObjectId(match["stageId"]),
            "result": "None"
        }))

        stageOfChangedMatch = stages_collection.find_one({"_id": ObjectId(match["stageId"]) })

        if len(not_finished_matches) > 0:
            if verbose:
                print("{} matches are yet to be played in stage {}".format(len(not_finished_matches), stageOfChangedMatch["name"]))
        else:
            if stageOfChangedMatch["name"] == "Final":
                if verbose:
                    print("Tournament {} has been simulated".format(id))
            else:
                stages_collection.update_one(
                    {"tournamentId": id, "order": stageOfChangedMatch["order"] + 1},
                    {"$set": {"status": "active"}}
                )

                if verbose:
                    print("Stage {} for tournament {} is now active".format(stageOfChangedMatch["order"] + 1, id))

                stage = stages_collection.find_one({"tournamentId": id, "order": stageOfChangedMatch["order"] + 1})

                while stage and stage["status"] == "active":
                    confirmTeamsForStage(id, stage["order"])
                    stage = stages_collection.find_one({"tournamentId": id, "order": stage["order"] + 1})

    except ValueError as e:
        return jsonify(str(e)), 404

    return jsonify({"message": f"Tournament id {id} match #{match_num} updated successfully"})

@events_bp.route('/tournaments/<string:id>/match/clear', methods=['PATCH'])
def clear_tournament_matches(id):
    try:
        mode = request.args.get("mode", "") 

        filter = {}

        if mode == "all":
            filter = {"tournamentId": id, "status": "incomplete"}
        elif mode == "stage":
            stage_order = request.args.get("stageOrder", type=int) 
            stage = stages_collection.find_one({"tournamentId": id, "order": stage_order})
            
            if not stage:
                return jsonify({"error": "Stage not found"}), 404
            
            filter = {"tournamentId": id, "stageId": ObjectId(stage["_id"]), "status": "incomplete"}
        elif mode == "match-numbers":
            match_nums = request.args.get("match_nums", "") 
            
            filter = {"tournamentId": id, "matchNumber": {"$in": list(map(int, match_nums.split(",")))}, "status": "incomplete"}


        matches = list(matches_collection.aggregate([
                {
                    "$match": filter
                },
                {
                    "$lookup": {
                        "from": "stages",
                        "localField": "stageId",
                        "foreignField": "_id",
                        "as": "stage"
                    }
                },
                {
                    "$unwind": "$stage"
                },
                {
                    "$set": {
                        "stageType": "$stage.type",
                    }
                }
            ]))

        match_numbers = list(map(lambda x: x["matchNumber"], matches))

        team_acc = defaultdict(lambda: defaultdict(int))

        for match in matches:
            home_id = match["homeStageTeamId"]
            away_id = match["awayStageTeamId"]

            team_acc[home_id]["runsScored"] += -match["homeTeamRuns"]
            team_acc[home_id]["runsConceded"] += -match["awayTeamRuns"]

            team_acc[home_id]["ballsBowled"] += -(120 if match["awayTeamWickets"] == 10 else match["awayTeamBalls"])
            team_acc[home_id]["ballsFaced"] += -(120 if match["homeTeamWickets"] == 10 else match["homeTeamBalls"])

            team_acc[away_id]["runsScored"] += -match["awayTeamRuns"]
            team_acc[away_id]["runsConceded"] += -match["homeTeamRuns"]

            team_acc[away_id]["ballsBowled"] += -(120 if match["homeTeamWickets"] == 10 else match["homeTeamBalls"])
            team_acc[away_id]["ballsFaced"] += -(120 if match["awayTeamWickets"] == 10 else match["awayTeamBalls"])

            if match["stageType"] == "group":
                if match["result"] == "Home-win":
                    team_acc[home_id]["won"] += -1
                    team_acc[home_id]["points"] += -2
                    team_acc[home_id]["matchesPlayed"] += -1
                    team_acc[away_id]["lost"] += -1
                    team_acc[away_id]["matchesPlayed"] += -1
                elif match["result"] == "Away-win":
                    team_acc[away_id]["won"] += -1
                    team_acc[away_id]["points"] += -2
                    team_acc[away_id]["matchesPlayed"] += -1
                    team_acc[home_id]["lost"] += -1
                    team_acc[home_id]["matchesPlayed"] += -1
                elif match["result"] == "No-result":
                    team_acc[home_id]["matchesPlayed"] += -1
                    team_acc[home_id]["points"] += -1
                    team_acc[home_id]["noResult"] += -1
                    team_acc[away_id]["matchesPlayed"] += -1
                    team_acc[away_id]["points"] += -1
                    team_acc[away_id]["noResult"] += -1
            
        operations = [
            UpdateOne(
                {"_id": ObjectId(team_id)},
                {"$inc": dict(inc_fields)}
            )
            for team_id, inc_fields in team_acc.items()
        ]

        if operations:
            stageTeams_collection.bulk_write(operations)

        result = matches_collection.update_many(
            {"tournamentId": id, "matchNumber": {"$in": match_numbers}, "status": "incomplete"},
            {"$set": { "homeTeamRuns": 0, "homeTeamWickets": 0, "homeTeamBalls": 0, "awayTeamRuns": 0, "awayTeamWickets": 0, "awayTeamBalls": 0, "result": "None" }}
        )

        if result.matched_count == 0:
            raise ValueError("No matches were found")

        firstMostRecentStage = stages_collection.find_one({"_id": ObjectId(matches[0]["stageId"])})
        

        if firstMostRecentStage["name"] == "Final":
            if verbose:
                print("Final has been reset")
        else:
            nextStage = stages_collection.find_one({"tournamentId": id, "order": firstMostRecentStage["order"] + 1})

            while nextStage and nextStage["status"] == "active":
                stages_collection.update_one(
                    {"_id": ObjectId(nextStage["_id"])},
                    {"$set": {"status": "locked"}}
                )

                if nextStage["type"] == "group":
                    stageTeams_collection.update_many(
                        {"tournamentId": id, "stageId": ObjectId(nextStage["_id"])},
                        [{"$set": {"teamId": "$preseededTeamId", "confirmed": False,
                        "matchesPlayed": 0, "points": 0, "won": 0, "lost": 0, "noResult": 0,
                        "runsScored": 0, "runsConceded": 0, "ballsBowled": 0, "ballsFaced": 0}}]
                    )
                else:
                    stageTeams_collection.update_many(
                        {"tournamentId": id, "stageId": ObjectId(nextStage["_id"])},
                        [{"$set": {"teamId": None, "confirmed": False,
                        "runsScored": 0, "runsConceded": 0, "ballsBowled": 0, "ballsFaced": 0}}]
                    )
                        

                matches_collection.update_many(
                    {"tournamentId": id, "stageId": ObjectId(nextStage["_id"])},
                    {"$set": { "homeTeamRuns": 0, "homeTeamWickets": 0, "homeTeamBalls": 0, "awayTeamRuns": 0, "awayTeamWickets": 0, "awayTeamBalls": 0, "result": "None" }}
                )          

                nextStage = stages_collection.find_one({"tournamentId": id, "order": nextStage["order"] + 1})
                          
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"message": f"{result.matched_count} matched - {result.modified_count} modified:"
                               f" {id} matches cleared successfully"})

@events_bp.route('/tournaments/<string:id>/match/score/<int:match_num>/<int:home_runs>/<int:home_wickets>/<string:home_overs>/<int:away_runs>/<int:away_wickets>/<string:away_overs>', methods=['PATCH'])
def nrr_tournament_match(id, match_num, home_runs, home_wickets, home_overs, away_runs, away_wickets, away_overs):

    new_home_balls = overs_to_balls(home_overs)
    new_away_balls = overs_to_balls(away_overs)

    try:
        old_match = matches_collection.find_one_and_update(
            {"tournamentId": id, "matchNumber": int(match_num)},
            {"$set": {
                "homeTeamRuns":    int(home_runs),
                "homeTeamWickets": int(home_wickets),
                "homeTeamBalls":   new_home_balls,
                "awayTeamRuns":    int(away_runs),
                "awayTeamWickets": int(away_wickets),
                "awayTeamBalls":   new_away_balls,
            }},
            return_document=False  
        )

        if not old_match:
            raise ValueError("No match was found")

        hB = 120 if old_match["homeTeamWickets"] == 10 else old_match["homeTeamBalls"]
        aB = 120 if old_match["awayTeamWickets"] == 10 else old_match["awayTeamBalls"]

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["homeStageTeamId"])},
            {"$inc": {
                "runsScored":   int(home_runs)    - old_match["homeTeamRuns"],
                "runsConceded":  int(away_runs)    - old_match["awayTeamRuns"],
                "ballsBowled":  (120 if int(away_wickets) == 10 else new_away_balls) - aB,
                "ballsFaced":   (120 if int(home_wickets) == 10 else new_home_balls) - hB,
            }}
        )

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["awayStageTeamId"])},
            {"$inc": {
                "runsScored":   int(away_runs)    - old_match["awayTeamRuns"],
                "runsConceded":  int(home_runs)    - old_match["homeTeamRuns"],
                "ballsBowled":  (120 if int(home_wickets) == 10 else new_home_balls) - hB,
                "ballsFaced":   (120 if int(away_wickets) == 10 else new_away_balls) - aB,
            }}
        )

    except ValueError as e:
        return jsonify(str(e)), 404

    return jsonify({"message": f"Tournament id {id} match #{match_num} score updated successfully"})


@events_bp.route('/tournaments/<string:id>/match/simulate', methods=['PATCH'])
def simulate_tournament_matches(id):
    stage_num = request.args.get("stage_num", type=int)
    
    highestActiveStage = stages_collection.find_one(
        {
            "tournamentId": id,
            "status": "active",
            "order": stage_num
        }
    )

    stage_id = ObjectId(highestActiveStage["_id"])
    is_group_stage = highestActiveStage["type"] == "group"

    matches = list(matches_collection.find({
        "tournamentId": id,
        "stageId": stage_id,
        "status": "incomplete"
    }))

    team_updates = []
    match_updates = []

    for match in matches:
        result = random.choices(
            ["Home-win", "Away-win", "No-result"],
            weights=[0.45, 0.45, 0.10]
        )[0]

        if is_group_stage:
            home_id = ObjectId(match["homeStageTeamId"])
            away_id = ObjectId(match["awayStageTeamId"])
            old_result = match.get("result")

            if old_result == "Home-win":
                team_updates.append(UpdateOne(
                    {"_id": home_id},
                    {"$inc": {"won": -1, "points": -2, "matchesPlayed": -1}}
                ))
                team_updates.append(UpdateOne(
                    {"_id": away_id},
                    {"$inc": {"lost": -1, "matchesPlayed": -1}}
                ))

            elif old_result == "Away-win":
                team_updates.append(UpdateOne(
                    {"_id": away_id},
                    {"$inc": {"won": -1, "points": -2, "matchesPlayed": -1}}
                ))
                team_updates.append(UpdateOne(
                    {"_id": home_id},
                    {"$inc": {"lost": -1, "matchesPlayed": -1}}
                ))

            elif old_result == "No-result":
                team_updates.append(UpdateOne(
                    {"_id": home_id},
                    {"$inc": {"matchesPlayed": -1, "points": -1, "noResult": -1}}
                ))
                team_updates.append(UpdateOne(
                    {"_id": away_id},
                    {"$inc": {"matchesPlayed": -1, "points": -1, "noResult": -1}}
                ))

            if result == "Home-win":
                team_updates.append(UpdateOne(
                    {"_id": home_id},
                    {"$inc": {"won": 1, "points": 2, "matchesPlayed": 1}}
                ))
                team_updates.append(UpdateOne(
                    {"_id": away_id},
                    {"$inc": {"lost": 1, "matchesPlayed": 1}}
                ))

            elif result == "Away-win":
                team_updates.append(UpdateOne(
                    {"_id": away_id},
                    {"$inc": {"won": 1, "points": 2, "matchesPlayed": 1}}
                ))
                team_updates.append(UpdateOne(
                    {"_id": home_id},
                    {"$inc": {"lost": 1, "matchesPlayed": 1}}
                ))

            elif result == "No-result":
                team_updates.append(UpdateOne(
                    {"_id": home_id},
                    {"$inc": {"matchesPlayed": 1, "points": 1, "noResult": 1}}
                ))
                team_updates.append(UpdateOne(
                    {"_id": away_id},
                    {"$inc": {"matchesPlayed": 1, "points": 1, "noResult": 1}}
                ))

        match_updates.append(UpdateOne(
            {"_id": match["_id"]},
            {"$set": {"result": result}}
        ))

    if team_updates:
        stageTeams_collection.bulk_write(team_updates)

    if match_updates:
        matches_collection.bulk_write(match_updates)

    if highestActiveStage["name"] != "Final":

        stages_collection.update_one(
            {"tournamentId": id, "order": highestActiveStage["order"] + 1},
            {"$set": {"status": "active"}}
        )

        if verbose:
            print(f"Stage {highestActiveStage['order'] + 1} for tournament {id} is now active")


        nextStage = stages_collection.find_one({"tournamentId": id, "order": highestActiveStage["order"] + 1})

        while nextStage and nextStage["status"] == "active":
            confirmTeamsForStage(id, nextStage["order"])
            nextStage = stages_collection.find_one(
                {
                    "tournamentId": id,
                    "order": nextStage["order"] + 1
                }
            )

    return jsonify({
        "message": f"Tournament id {id} stage {highestActiveStage['name']} simulated successfully"
    })