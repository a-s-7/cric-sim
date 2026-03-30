import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from flask import jsonify

from dotenv import load_dotenv
load_dotenv()

verbose = True

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
            "logo": "$team.logo",
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
            "stageStatus": "$stage.status",
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
        stageStatus = team["stageStatus"]
        stageName = team["stageName"]
        group = team.get("group") or "LEAGUE"
        numQualifiers = team["numQualifiers"]

        if stageOrder not in standings:
            standings[stageOrder] = {
                "stageName": stageName,
                "stageStatus": stageStatus,
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

    return {"standings": sorted_standings, "category": tournament["category"]}
    

def confirmTeamsForStage(tournamentId, stageOrder):    
    currentStage = stages_collection.find_one({"tournamentId": tournamentId, "order": stageOrder})

    if currentStage["type"] == "group":
        stageTeams_collection.update_many(
            {"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])},
            [{"$set": {"teamId": "$preseededTeamId", "confirmed": False}}]
        )

        previousStageStandings = get_tournament_standings(tournamentId, [stageOrder - 1])

        prevStageGroups = previousStageStandings["standings"][0]["groups"]

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

        if currentStage["name"] == "Playoffs":
            confirmTeamsForPlayoffs(tournamentId, stageOrder, stageTeams, currentStage)
        elif currentStage["name"] == "Semi-final":
            standings = get_tournament_standings(tournamentId, [stageOrder - 1])
            prevStageGroups = standings["standings"][0]["groups"]

            for team in stageTeams:
                group_name = team.get("teamFromStandingsGroup") or "LEAGUE"
                standingsGroup = prevStageGroups[group_name]
                standingsTeam = standingsGroup[team.get("teamFromStandingsPosition", 1) - 1]
                
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
                elif match["result"] == "No-result":
                    hT = stageTeams_collection.find_one({"_id": ObjectId(match["homeStageTeamId"])})
                    aT = stageTeams_collection.find_one({"_id": ObjectId(match["awayStageTeamId"])})

                    if verbose:
                        print(f"Deciding Finalist for 'No-result' in Semi-final {match.get('matchNumber', 'N/A')}: {hT['teamId']} (Pos {hT.get('teamFromStandingsPosition')}) vs {aT['teamId']} (Pos {aT.get('teamFromStandingsPosition')})")

                    # Note: Comparing teamFromStandingsPosition works for 1st vs 2nd crossover semi-finals.
                    # For 1st vs 1st matches, standings data (points/NRR) would be needed for a proper tie-break.
                    if hT["teamFromStandingsPosition"] < aT["teamFromStandingsPosition"]:
                        id = match["homeStageTeamId"]
                    else:
                        id = match["awayStageTeamId"]

                    if verbose:
                        chosen = hT if id == match["homeStageTeamId"] else aT
                        print(f"  -> {chosen['teamId']} progresses as the higher-ranked seed.")

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


def confirmTeamsForPlayoffs(tournamentId, stageOrder, stageTeams, currentStage):
    # Get standings from the previous stage (league)
    standings = get_tournament_standings(tournamentId, [stageOrder - 1])
    standingsGroup = standings["standings"][0]["groups"]["LEAGUE"]

    # Get matches for the current playoffs stage 
    matches = list(matches_collection.find({"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])}).sort("matchNumber", 1))
    q1, elim, q2, final = matches[0], matches[1], matches[2], matches[3]

    # Resolves a team slot by mapping its assigned seed position (e.g., 1st vs 2nd) to the actual team from the previous stage's standings
    def update_from_standings(st_id):
        st = stageTeams_collection.find_one({"_id": ObjectId(st_id)})
        standings_team = standingsGroup[st.get("teamFromStandingsPosition", 1) - 1]
        stageTeams_collection.update_one({"_id": st["_id"]}, {"$set": {"teamId": standings_team["teamId"], "confirmed": True}})

    # Assigns a team to a match slot by identifying the winner or loser of a specific previous match based on its result
    def update_from_result(target_st_id, source_match, winner=True):
        if source_match["result"] == "No-result":
            source_st = decide_playoff_no_result(source_match, winner, standingsGroup)
        else:
            is_home_win = source_match["result"] == "Home-win"
            source_st_id = (source_match["homeStageTeamId"] if is_home_win else source_match["awayStageTeamId"]) if winner else \
                            (source_match["awayStageTeamId"] if is_home_win else source_match["homeStageTeamId"])
            source_st = stageTeams_collection.find_one({"_id": ObjectId(source_st_id)})

        stageTeams_collection.update_one({"_id": ObjectId(target_st_id)}, {"$set": {"teamId": source_st["teamId"], "confirmed": True}})

    # Initial assignments for Q1 and Eliminator
    for match in [q1, elim]:
        update_from_standings(match["homeStageTeamId"])
        update_from_standings(match["awayStageTeamId"])

    # Progression logic for Q2 and Final
    if q1["result"] != "None":
        update_from_result(q2["homeStageTeamId"], q1, winner=False)  # Q1 Loser
        update_from_result(final["homeStageTeamId"], q1, winner=True) # Q1 Winner

    if elim["result"] != "None":
        update_from_result(q2["awayStageTeamId"], elim, winner=True)  # Elim Winner

    if q2["result"] != "None":
        update_from_result(final["awayStageTeamId"], q2, winner=True) # Q2 Winner

       
def decide_playoff_no_result(source_match, winner=True, standings=[]):
    homeSt = stageTeams_collection.find_one({"_id": ObjectId(source_match["homeStageTeamId"])}) 
    awaySt = stageTeams_collection.find_one({"_id": ObjectId(source_match["awayStageTeamId"])}) 

    if verbose:
        print(f"Deciding playoff progression for 'No-result' in match {source_match.get('matchNumber', 'N/A')}: {homeSt['teamId']} vs {awaySt['teamId']}")

    for team in standings:
        if team["teamId"] == homeSt["teamId"]:
            if verbose: print(f"  -> {homeSt['teamId']} is higher in standings than {awaySt['teamId']}. Choosing {homeSt['teamId'] if winner else awaySt['teamId']} as {'winner' if winner else 'loser'}.")
            return homeSt if winner else awaySt
        elif team["teamId"] == awaySt["teamId"]:
            if verbose: print(f"  -> {awaySt['teamId']} is higher in standings than {homeSt['teamId']}. Choosing {awaySt['teamId'] if winner else homeSt['teamId']} as {'winner' if winner else 'loser'}.")
            return awaySt if winner else homeSt

    return None        
                
            
            
        
        






    
    




