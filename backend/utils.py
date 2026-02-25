import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from flask import jsonify

from dotenv import load_dotenv
load_dotenv()

verbose = False

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
            "teamId": "$team._id",
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

    return sorted_standings
    

def confirmTeamsForStage(tournamentId, stageOrder):    
    currentStage = stages_collection.find_one({"tournamentId": tournamentId, "order": stageOrder})

    if currentStage["type"] == "group":
        stageTeams_collection.update_many(
            {"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])},
            [{"$set": {"teamId": "$preseededTeamId", "confirmed": False}}]
        )

        previousStageStandings = get_tournament_standings(tournamentId, [stageOrder - 1])

        prevStageGroups = previousStageStandings[0]["groups"]

        for key, val in prevStageGroups.items():
            groupName = key 
            teams = val

            firstPlaceTeam = teams[0]
            secondPlaceTeam = teams[1]

            qualifierIds = {
                firstPlaceTeam["teamId"],
                secondPlaceTeam["teamId"]
            }

            seededTeams = list(stageTeams_collection.find({"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": { "$regex": "^" + groupName }}))

            seededIds = {team["teamId"] for team in seededTeams}

            qualifyingTeamIdsNotSeeded = qualifierIds - seededIds
            seededTeamIdsNotQualified = seededIds - qualifierIds

            if verbose:
                print(f"Group {groupName}: qualifiers are {firstPlaceTeam['teamId']} (1st) and {secondPlaceTeam['teamId']} (2nd)")
                print(f"Group {groupName}: seeded teams are {seededIds}")
            
            if len(qualifyingTeamIdsNotSeeded) == 0:
                if verbose:
                    print(f"Group {groupName}: both seeded teams qualified, confirming as-is")

                stageTeams_collection.update_many(
                    {"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": { "$regex": "^" + groupName }},
                    {
                        "$set": {
                            "confirmed": True
                        }
                    })

            elif len(qualifyingTeamIdsNotSeeded) == 1:
                replacing = seededTeamIdsNotQualified.copy().pop()
                replacement = qualifyingTeamIdsNotSeeded.copy().pop()

                if verbose:
                    print(f"Group {groupName}: replacing {replacing} with {replacement}")

                stageTeamThatDidNotQualify = stageTeams_collection.find_one_and_update(
                    {"stageId": currentStage["_id"], "teamId": seededTeamIdsNotQualified.pop()},
                    {
                        "$set": {
                            "teamId": qualifyingTeamIdsNotSeeded.pop()
                        }
                    })

                stageTeams_collection.update_many(
                    {"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": { "$regex": "^" + groupName }},
                    {
                        "$set": {
                            "confirmed": True
                        }
                    })
            else:
                # print(f"Group {groupName}: neither seeded team qualified, replacing both. {firstPlaceTeam['teamId']} -> slot 1, {secondPlaceTeam['teamId']} -> slot 2")
                s1 = groupName + "1"
                s2 = groupName + "2"

                if verbose:
                    print(f"Group {groupName}: neither seeded team qualified. {s1} ({[t['teamId'] for t in seededTeams if t['seedToGroupMapping'] == s1][0]}) replaced by {firstPlaceTeam['teamId']} (1st place), {s2} ({[t['teamId'] for t in seededTeams if t['seedToGroupMapping'] == s2][0]}) replaced by {secondPlaceTeam['teamId']} (2nd place)")

                stageTeams_collection.update_one(
                    {"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": s1},
                    {
                        "$set": {
                            "teamId": firstPlaceTeam["teamId"],
                            "confirmed": True
                        }
                    }
                )

                stageTeams_collection.update_one(
                    {"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": s2},
                    {
                        "$set": {
                            "teamId": secondPlaceTeam["teamId"],
                            "confirmed": True
                        }
                    })
   
    else:   
        stageTeams = list(stageTeams_collection.find({"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])}))

        if currentStage["name"] == "Semi-final":
            standings = get_tournament_standings(tournamentId, [stageOrder - 1])
            prevStageGroups = standings[0]["groups"]

            for team in stageTeams:
                standingsGroup = prevStageGroups[team["teamFromStandingsGroup"]]
                standingsTeam = standingsGroup[team["teamFromStandingsPosition"] - 1]
                
                stageTeams_collection.update_one(
                    {"_id": ObjectId(team["_id"])},
                    {
                        "$set": {
                            "teamId": standingsTeam["teamId"],
                            "confirmed": True
                        }
                    })
        elif currentStage["name"] == "Final":

            for team in stageTeams:
                match = matches_collection.find_one({"tournamentId": tournamentId, "matchNumber": team["teamFromMatchNumber"]})

                id = None

                if match["result"] == "Home-win":
                    id = match["homeStageTeamId"]
                else:
                    id = match["awayStageTeamId"]
                        

                stageTeam = stageTeams_collection.find_one({"_id": ObjectId(id)})

                stageTeams_collection.update_one(
                    {"_id": ObjectId(team["_id"])},
                    {
                        "$set": {
                            "teamId": stageTeam["teamId"],
                            "confirmed": True
                        }
                    })


        

       
        
                
            
            

        
        






    
    




