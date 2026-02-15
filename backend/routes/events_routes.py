import os
from datetime import datetime, timedelta
import random

from flask import Blueprint, jsonify, request
from pymongo import MongoClient, UpdateOne
from bson import ObjectId

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
def get_events_info():
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
@events_bp.route('/tournaments/<string:id>/standings', methods=['GET'])
def get_tournaments_standings(id):
    tournament = tournaments_collection.find_one({"_id": id})

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404

    # Get all stage-team info with team and stage details
    stageTeamsData = list(stageTeams_collection.aggregate([
        {"$match": {"tournamentId": id}},
        {"$lookup": {
            "from": "teams",
            "localField": "teamId",
            "foreignField": "_id",
            "as": "team"
        }},
        {"$unwind": "$team"},
        {"$lookup": {
            "from": "stages",
            "localField": "stageId",
            "foreignField": "_id",
            "as": "stage"
        }},
        {"$unwind": "$stage"},
        {"$project": {
            "_id": 0,
            "name": "$team.name",
            "flag": "$team.flag",
            "group": "$group",
            "played": "$matchesPlayed",
            "won": "$won",
            "lost": "$lost",
            "noResult": "$noResult",
            "ballsFaced": "$ballsFaced",
            "ballsBowled": "$ballsBowled",
            "runsScored": "$runsScored",
            "runsConceded": "$runsConceded",
            "netRunRate": "$netRunRate",
            "points": "$points",
            "stageName": "$stage.name",
            "stageOrder": "$stage.order",
            "confirmed": "$confirmed",
            "seed": "$seed"
        }}
    ]))

    # Organize into stages -> groups -> teams
    standings = {}

    for team in stageTeamsData:
        stageOrder = team["stageOrder"]
        stageName = team["stageName"]
        group = team["group"]

        if stageOrder not in standings:
            standings[stageOrder] = {
                "stageName": stageName,
                "stageOrder": stageOrder,
                "groups": {}
            }
        
        if group not in standings[stageOrder]["groups"]:
            standings[stageOrder]["groups"][group] = []

        standings[stageOrder]["groups"][group].append(team)

    # Sort stages by stageOrder
    sorted_standings = [standings[k] for k in sorted(standings.keys())]

    return jsonify(sorted_standings)
