import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from flask import jsonify

try:
    from google.genai.errors import ClientError as GenaiClientError
except ImportError:
    GenaiClientError = None

def is_gemini_quota_error(e):
    """
    Check if the given exception is a Gemini Quota/Rate Limit (429/RESOURCE_EXHAUSTED) error.
    """
    if GenaiClientError and isinstance(e, GenaiClientError) and getattr(e, 'status_code', None) == 429:
        return True
    err_str = str(e)
    return "RESOURCE_EXHAUSTED" in err_str or "429" in err_str

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
            "teamId": "$team.acronym",
            "teamDbId": "$team._id",
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
        ballsPerOver = 5 if tournament["format"] == "HUNDRED" else 6
        
        totalOversFaced = team["ballsFaced"] / ballsPerOver
        totalOversBowled = team["ballsBowled"] / ballsPerOver

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

    return {"standings": sorted_standings, "category": tournament["category"],}
    

def confirmTeamsForStage(tournamentId, stageOrder):    
    currentStage = stages_collection.find_one({"tournamentId": tournamentId, "order": stageOrder})

    if currentStage["type"] == "group":
        sample_team = stageTeams_collection.find_one({"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])})
        if "preseededTeamId" in sample_team:
            confirmTeamsForGroupStageWithPreseeding(tournamentId, stageOrder, currentStage)
        else:
            confirmTeamsForGroupStageBasic(tournamentId, stageOrder, currentStage)
    else:   
        if currentStage["name"] == "Playoffs":
            confirmTeamsForPlayoffs(tournamentId, stageOrder, currentStage)
        elif currentStage["name"] == "Semi-final":
            stageTeams = list(stageTeams_collection.find({"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])}))

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
                            "teamId": standingsTeam["teamDbId"],
                            "confirmed": True
                        }
                    })
        elif currentStage["name"] == "Final":
            stageTeams = list(stageTeams_collection.find({"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])}))
            prevStageGroups = None

            for team in stageTeams:
                if team["teamFromPreviousStage"] == "standings":
                    if prevStageGroups is None:
                        standings = get_tournament_standings(tournamentId, [stageOrder - 1])
                        prevStageGroups = standings["standings"][0]["groups"]
                    
                    group_name = team["teamFromStandingsGroup"] or "LEAGUE"
                    standingsGroup = prevStageGroups[group_name]
                    
                    standingsTeam = standingsGroup[team["teamFromStandingsPosition"] - 1]
                    
                    if verbose:
                        print(f"{standingsTeam['teamDbId']} (Pos {team['teamFromStandingsPosition']}) progresses to Final")
                    
                    stageTeams_collection.update_one(
                        {"_id": ObjectId(team["_id"])},
                        {
                            "$set": {
                                "teamId": standingsTeam["teamDbId"],
                                    "confirmed": True
                                }
                            })
                else:
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

                    elif match["result"] == "Away-win":
                        id = match["awayStageTeamId"]


                    if id:
                        stageTeam = stageTeams_collection.find_one({"_id": ObjectId(id)})

                        stageTeams_collection.update_one(
                        {"_id": ObjectId(team["_id"])},
                        {
                            "$set": {
                                "teamId": stageTeam["teamId"],
                                "confirmed": True
                            }
                        })
                    else:
                        stageTeams_collection.update_one(
                            {"_id": ObjectId(team["_id"])},
                        {
                            "$set": {
                                "teamId": None,
                                "confirmed": False
                            }
                        })


def confirmTeamsForGroupStageBasic(tournamentId, stageOrder, currentStage):
    stageTeams_collection.update_many(
        {"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])},
        {"$set": {"teamId": None, "confirmed": False}}
    )

    previousStageStandings = get_tournament_standings(tournamentId, [stageOrder - 1])
    prevStageGroups = previousStageStandings["standings"][0]["groups"]

    for key, val in prevStageGroups.items():
        groupName = key 
        teams = val

        for i, team in enumerate(teams):
            seedString = f"{groupName}{i + 1}"
            
            slot = stageTeams_collection.find_one({"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": seedString})
            if slot:
                if verbose:
                    print(f"Group {groupName}: {seedString} replaced by {team['teamDbId']} ({i + 1} place)")
                stageTeams_collection.update_one(
                    {"_id": slot["_id"]},
                    {
                        "$set": {
                            "teamId": team["teamDbId"],
                            "confirmed": True
                        }
                    }
                )

def confirmTeamsForGroupStageWithPreseeding(tournamentId, stageOrder, currentStage):
    stageTeams_collection.update_many(
        {"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])},
        [{"$set": {"teamId": "$preseededTeamId", "confirmed": False}}]
    )

    previousStageStandings = get_tournament_standings(tournamentId, [stageOrder - 1])

    prevStageGroups = previousStageStandings["standings"][0]["groups"]

    for key, val in prevStageGroups.items():
        groupName = key 
        teams = val

        # Get the top 2 teams from the previous stage's group
        firstPlaceTeam = teams[0]
        secondPlaceTeam = teams[1]

        qualifierIds = {
            firstPlaceTeam["teamDbId"],
            secondPlaceTeam["teamDbId"]
        }

        # Find teams that were pre-seeded for this group (e.g. A1, A2)
        seededTeams = list(stageTeams_collection.find({"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": { "$regex": "^" + groupName }}))

        seededIds = {team["teamId"] for team in seededTeams}

        # Determine which qualifiers were not pre-seeded and which pre-seeded teams failed to qualify
        qualifyingTeamIdsNotSeeded = qualifierIds - seededIds
        seededTeamIdsNotQualified = seededIds - qualifierIds

        if verbose:
            print(f"Group {groupName}: qualifiers are {firstPlaceTeam['teamId']} (1st) and {secondPlaceTeam['teamId']} (2nd)")
            print(f"Group {groupName}: seeded teams are {seededIds}")
        
        # Scenario 1: The exact pre-seeded teams qualified, confirm their spots
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

        # Scenario 2: One pre-seeded team failed to qualify, replace them with the unseeded qualifier
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
        
        # Scenario 3: Neither pre-seeded team qualified, assign the 1st place team to slot 1 and 2nd place to slot 2
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
                        "teamId": firstPlaceTeam["teamDbId"],
                        "confirmed": True
                    }
                }
            )

            stageTeams_collection.update_one(
                {"tournamentId": tournamentId, "stageId": currentStage["_id"], "seedToGroupMapping": s2},
                {
                    "$set": {
                        "teamId": secondPlaceTeam["teamDbId"],
                        "confirmed": True
                    }
                })

def confirmTeamsForPlayoffs(tournamentId, stageOrder, currentStage):
    matches = list(matches_collection.find({"tournamentId": tournamentId, "stageId": ObjectId(currentStage["_id"])}).sort("matchNumber", 1))

    if len(matches) == 2:
        confirmTeamsFor3TeamPlayoffs(tournamentId, stageOrder, matches)
    elif len(matches) == 4:
        confirmTeamsFor4TeamPlayoffs(tournamentId, stageOrder, matches)
    else:
        raise ValueError(f"Unsupported playoff match count: {len(matches)}")

def reset_playoff_match(match):
    matches_collection.update_one(
        {"_id": match["_id"]},
        {"$set": { "homeTeamRuns": 0, 
                        "homeTeamWickets": 0, 
                        "homeTeamBalls": 0, 
                        "awayTeamRuns": 0, 
                        "awayTeamWickets": 0, 
                        "awayTeamBalls": 0, 
                        "homeMaxBalls": 0,
                        "awayMaxBalls": 0,
                        "result": "None" 
        }}
    )
    match["result"] = "None"

# Resolves a team slot by mapping its assigned seed position (e.g., 1st vs 2nd) to the actual team from the previous stage's standings
def update_stage_team_from_standings(st_id, standingsGroup):
    st = stageTeams_collection.find_one({"_id": ObjectId(st_id)})
    standings_team = standingsGroup[st.get("teamFromStandingsPosition", 1) - 1]
    stageTeams_collection.update_one({"_id": st["_id"]}, {"$set": {"teamId": standings_team["teamDbId"], "confirmed": True}})

# Assigns a team to a match slot by identifying the winner or loser of a specific previous match based on its result
def update_stage_team_from_result(target_st_id, source_match, standingsGroup, winner=True):
    if source_match["result"] == "No-result":
        source_st = decide_playoff_no_result(source_match, winner, standingsGroup)
    else:
        is_home_win = source_match["result"] == "Home-win"
        source_st_id = (source_match["homeStageTeamId"] if is_home_win else source_match["awayStageTeamId"]) if winner else \
                        (source_match["awayStageTeamId"] if is_home_win else source_match["homeStageTeamId"])
        source_st = stageTeams_collection.find_one({"_id": ObjectId(source_st_id)})

    stageTeams_collection.update_one({"_id": ObjectId(target_st_id)}, {"$set": {"teamId": source_st["teamId"], "confirmed": True}})

def confirmTeamsFor3TeamPlayoffs(tournamentId, stageOrder, matches):
    # Get standings from the previous stage
    standings = get_tournament_standings(tournamentId, [stageOrder - 1])
    standingsGroup = standings["standings"][0]["groups"]["LEAGUE"]

    # Get matches for the current playoffs stage format
    # ELIMINATOR -> FINAL
    elim, final = matches[0], matches[1]

    # Initial assignments for Eliminator and Final
    update_stage_team_from_standings(elim["homeStageTeamId"], standingsGroup)
    update_stage_team_from_standings(elim["awayStageTeamId"], standingsGroup)
    update_stage_team_from_standings(final["homeStageTeamId"], standingsGroup)

    # Progression logic for Final
    if elim["result"] != "None":
        update_stage_team_from_result(final["awayStageTeamId"], elim, standingsGroup, winner=True)  # Elim Winner
    else:
        stageTeams_collection.update_one(
            {"_id": ObjectId(final["awayStageTeamId"])},
            {"$set": {"teamId": None, "confirmed": False}}
        )
    
    # Reset Final match if dependencies are not met (ripple effect for clearing)
    if elim["result"] == "None":
        reset_playoff_match(final)

def confirmTeamsFor4TeamPlayoffs(tournamentId, stageOrder, matches):
    # Get standings from the previous stage (league)
    standings = get_tournament_standings(tournamentId, [stageOrder - 1])
    standingsGroup = standings["standings"][0]["groups"]["LEAGUE"]

    # Get matches for the current playoffs stage 
    q1, elim, q2, final = matches[0], matches[1], matches[2], matches[3]

    # Initial assignments for Q1 and Eliminator
    for match in [q1, elim]:
        update_stage_team_from_standings(match["homeStageTeamId"], standingsGroup)
        update_stage_team_from_standings(match["awayStageTeamId"], standingsGroup)

    # Progression logic for Q2 and Final
    if q1["result"] != "None":
        update_stage_team_from_result(q2["homeStageTeamId"], q1, standingsGroup, winner=False)  # Q1 Loser
        update_stage_team_from_result(final["homeStageTeamId"], q1, standingsGroup, winner=True) # Q1 Winner
    else:
        stageTeams_collection.update_many(
            {"_id": {"$in": [ObjectId(q2["homeStageTeamId"]), ObjectId(final["homeStageTeamId"])]}},
            {"$set": {"teamId": None, "confirmed": False}}
        )

    # Reset Q2 and Final matches if dependencies are not met (ripple effect for clearing)
    if q1["result"] == "None" or elim["result"] == "None":
        reset_playoff_match(q2)

    if q1["result"] == "None" or q2["result"] == "None":
        reset_playoff_match(final)

    if elim["result"] != "None":
        update_stage_team_from_result(q2["awayStageTeamId"], elim, standingsGroup, winner=True)  # Elim Winner
    else:
        stageTeams_collection.update_one(
            {"_id": ObjectId(q2["awayStageTeamId"])},
            {"$set": {"teamId": None, "confirmed": False}}
        )

    if q2["result"] != "None":
        update_stage_team_from_result(final["awayStageTeamId"], q2, standingsGroup, winner=True) # Q2 Winner
    else:
        stageTeams_collection.update_one(
            {"_id": ObjectId(final["awayStageTeamId"])},
            {"$set": {"teamId": None, "confirmed": False}}
        )

       
def decide_playoff_no_result(source_match, winner=True, standings=[]):
    homeSt = stageTeams_collection.find_one({"_id": ObjectId(source_match["homeStageTeamId"])}) 
    awaySt = stageTeams_collection.find_one({"_id": ObjectId(source_match["awayStageTeamId"])}) 

    if verbose:
        print(f"Deciding playoff progression for 'No-result' in match {source_match.get('matchNumber', 'N/A')}: {homeSt['teamId']} vs {awaySt['teamId']}")

    for team in standings:
        # Compare using teamDbId (full DB _id) against stageTeam.teamId — both are the full team _id
        if team["teamDbId"] == homeSt["teamId"]:
            if verbose: print(f"  -> {homeSt['teamId']} is higher in standings. Choosing {'home' if winner else 'away'} team.")
            return homeSt if winner else awaySt
        elif team["teamDbId"] == awaySt["teamId"]:
            if verbose: print(f"  -> {awaySt['teamId']} is higher in standings. Choosing {'away' if winner else 'home'} team.")
            return awaySt if winner else homeSt

    return None        
                
            
            
        
        






    
    




