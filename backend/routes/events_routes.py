import os
from datetime import datetime, timedelta
import random

from flask import Blueprint, jsonify, request
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from data.utils.tournamentsUtils import overs_to_balls
from collections import defaultdict
from utils import get_tournament_standings


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
                "tournamentId": id
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
    
    stages = list(stages_collection.find(
        {"tournamentId": id, "type": "group"},
        {"_id": 0, "label": "$name", "value": "$order"}
    ))

    if not stages:
        return jsonify({"error": "Stages not found"}), 404        

    return jsonify(stages)

@events_bp.route('/tournaments/<string:id>/standings', methods=['GET'])
def get_tournaments_standings(id):
    groupStageOrders = stages_collection.find({"tournamentId": id, "type": "group"})
    groupStageOrders = [s["order"] for s in groupStageOrders]

    return get_tournament_standings(id, groupStageOrders)

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
        {"$unwind": "$homeStageTeam"},
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
        {"$unwind": "$awayStageTeam"},
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

    return jsonify({"teams": teams_data, "matches": filtered_matches})

@events_bp.route('/tournaments/<string:id>/match/<int:match_num>/<string:result>', methods=['PATCH'])
def update_tournament_match_result(id, match_num, result):
    if result not in ["Home-win", "Away-win", "No-result"]:
        return jsonify({"error": "Invalid result value"}), 400

    try:
        match = matches_collection.find_one({"tournamentId": id, "matchNumber": match_num}) 

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

        print(f"{len(not_finished_matches)} left")

        if len(not_finished_matches) == 0:
            current_stage = stages_collection.find_one({"_id": ObjectId(match["stageId"]) })

            stages_collection.update_one(
                {"tournamentId": id, "order": current_stage["order"] + 1},
                {"$set": {"status": "active"}}
            )
            print("Stage {} for tournament {} is now active".format(current_stage["order"] + 1, id))

    except ValueError as e:
        return jsonify(str(e)), 404

    return jsonify({"message": f"Tournament id {id} match #{match_num} updated successfully"})

        
@events_bp.route('/tournaments/<string:id>/match/clear', methods=['PATCH'])
def clear_tournament_matches(id):
    try:
        match_nums = request.args.get("match_nums", "") 
        match_numbers = list(map(int, match_nums.split(",")))

        matches = list(matches_collection.find(
            {"tournamentId": id, 
             "matchNumber": {"$in": match_numbers},
             "status": "incomplete"}))

        if len(matches) == 0:
            raise ValueError("No incomplete matches were found")


        team_acc = defaultdict(lambda: defaultdict(int))

        for match in matches:
            home_id = match["homeStageTeamId"]
            away_id = match["awayStageTeamId"]

            team_acc[home_id]["runsScored"] += -match["homeTeamRuns"]
            team_acc[home_id]["runsConceded"] += -match["awayTeamRuns"]
            team_acc[home_id]["ballsBowled"] += -match["awayTeamBalls"]
            team_acc[home_id]["ballsFaced"] += -match["homeTeamBalls"]

            team_acc[away_id]["runsScored"] += -match["awayTeamRuns"]
            team_acc[away_id]["runsConceded"] += -match["homeTeamRuns"]
            team_acc[away_id]["ballsBowled"] += -match["homeTeamBalls"]
            team_acc[away_id]["ballsFaced"] += -match["awayTeamBalls"]

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


        current_stage = stages_collection.find_one({"_id": ObjectId(matches[0]["stageId"]) })

        nextStage = stages_collection.find_one({"tournamentId": id, "order": current_stage["order"] + 1})

        if nextStage["status"] == "active":
            stages_collection.update_one(
                {"_id": ObjectId(nextStage["_id"])},
                {"$set": {"status": "locked"}}
            )   
        
        print(result.matched_count, result.modified_count)

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

        homeRunsDiff  = int(home_runs)   - old_match["homeTeamRuns"]
        awayRunsDiff  = int(away_runs)   - old_match["awayTeamRuns"]
        homeBallsDiff = new_home_balls   - old_match["homeTeamBalls"]
        awayBallsDiff = new_away_balls   - old_match["awayTeamBalls"]

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["homeStageTeamId"])},
            {"$inc": {"runsScored": homeRunsDiff, "runsConceded": awayRunsDiff,
                      "ballsBowled": awayBallsDiff, "ballsFaced": homeBallsDiff}}
        )

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["awayStageTeamId"])},
            {"$inc": {"runsScored": awayRunsDiff, "runsConceded": homeRunsDiff,
                      "ballsBowled": homeBallsDiff, "ballsFaced": awayBallsDiff}}
        )

    except ValueError as e:
        return jsonify(str(e)), 404

    return jsonify({"message": f"Tournament id {id} match #{match_num} score updated successfully"})
