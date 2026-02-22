import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from flask import jsonify

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

def get_tournament_standings(id, stages):
    tournament = tournaments_collection.find_one({"_id": id})

    stageIds = stages_collection.find({"tournamentId": id, "order": {"$in": stages}})
    stageIds = [ObjectId(s["_id"]) for s in stageIds]

    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404

    # Get all stage-team info with team and stage details
    stageTeamsData = list(stageTeams_collection.aggregate([
        {"$match": {"tournamentId": id, "stageId": {"$in": stageIds}}},
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
            "points": "$points",
            "stageName": "$stage.name",
            "stageOrder": "$stage.order",
            "confirmed": "$confirmed",
            "seed": "$seed",
            "numQualifiers": "$stage.config.qualifiersPerGroup"
        }}
    ]))


    # Calculate NRR for each team
    for team in stageTeamsData:
        totalOversFaced = team["ballsFaced"] / 6
        totalOversBowled = team["ballsBowled"] / 6

        runRate = team["runsScored"] / totalOversFaced if totalOversFaced > 0 else 0
        runRateConceded = team["runsConceded"] / totalOversBowled if totalOversBowled > 0 else 0

        team["netRunRate"] = runRate - runRateConceded


    # Organize into stages -> groups -> teams
    standings = {}

    for team in stageTeamsData:
        stageOrder = team["stageOrder"]
        stageName = team["stageName"]
        group = team["group"]
        numQualifiers = team["numQualifiers"]

        if stageOrder not in standings:
            standings[stageOrder] = {
                "stageName": stageName,
                "stageOrder": stageOrder,
                "numQualifiers": numQualifiers,
                "groups": {}
            }
        
        if group not in standings[stageOrder]["groups"]:
            standings[stageOrder]["groups"][group] = []

        standings[stageOrder]["groups"][group].append(team)

    # # Sort stages by stageOrder (your data is a list, not dict)
    sorted_standings = [standings[key] for key in sorted(standings.keys())]

    for stage in sorted_standings:
        groups = stage["groups"]

        # Sort group keys (A-Z, 1-9 correctly)
        sorted_group_keys = sorted(groups.keys(), key=lambda x: (not x.isdigit(), x))

        # Rebuild groups in sorted order
        stage["groups"] = {
            group_key: sorted(
                groups[group_key],
                key=lambda team: (
                    team.get("played", 0) == 0,
                    -team.get("points"),
                    -team.get("netRunRate"),
                )
            )
            for group_key in sorted_group_keys
        }

    return jsonify(sorted_standings)