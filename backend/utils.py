import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from flask import jsonify, abort

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


def find_tournament(tournament_id):
    tournament = tournaments_collection.find_one({"_id": tournament_id})

    if tournament is None:
        abort(404, description=f"Tournament not found")

    return tournament

def find_limited_overs_tournament(tournament_id):
    tournament = find_tournament(tournament_id)

    if tournament["name"] == "ICC World Test Championship":
        abort(403, description=f"Tournament is not a limited-overs tournament")    

    return tournament

def find_wtc_tournament(tournament_id):
    tournament = find_tournament(tournament_id)

    if tournament["name"] != "ICC World Test Championship":
        abort(403, description=f"Tournament is not a world-test championship")    

    return tournament

def get_tournament_teams_data(tournament):
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
            standings = get_tournament_standings_data(tournament["_id"], [last_stage["order"] - 1])
            standingsGroup = standings["standings"][0]["groups"]["LEAGUE"]

            decided_team_id = decide_playoff_no_result(final_match, True, standingsGroup)["teamId"]
            return teams_collection.find_one({"_id": decided_team_id})["acronym"]

        winner1 = resolve_team_acronym(final_match["homeStageTeamId"])
        winner2 = resolve_team_acronym(final_match["awayStageTeamId"])
        return winner1 + "#" + winner2

    # Away-win
    return resolve_team_acronym(final_match["awayStageTeamId"])

def get_tournament_standings_data(tournament_id, stageOrders, allGroupStages = False):
    tournament = find_tournament(tournament_id)

    if allGroupStages:
        stages = stages_collection.find({"tournamentId": tournament_id, "type": "group"})
    else:
        stages = stages_collection.find({"tournamentId": tournament_id, "order": {"$in": stageOrders}})

    stageIds = [ObjectId(s["_id"]) for s in stages]
    
    stageTeamsPipeline = [
        {"$match": {"tournamentId": tournament_id, "stageId": {"$in": stageIds}}},
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
        {"$unwind": "$stage"}
    ]

    projectionCriteria = {
            "_id": 0,
            "teamId": "$team.acronym",
            "teamDbId": "$team._id",
            "name": "$team.name",
            "logo": "$team.logo",
            "group": "$group",
            "played": "$matchesPlayed",
            "won": "$won",
            "lost": "$lost",
            "stageName": "$stage.name",
            "stageOrder": "$stage.order",
            "stageStatus": "$stage.status",
            "points": "$points",
            "confirmed": "$confirmed",
            "seed": "$seed",
            "numQualifiers": "$stage.config.qualifiersPerGroup"
        }

    if tournament["format"] == "TEST":
        tournamentCriteria =  {"draw": "$draw",
                             "tied": "$tied",
                             "deductionPoints": "$deductionPoints"}
    else: 
        tournamentCriteria = {"noResult": "$noResult",
                            "ballsFaced": "$ballsFaced",
                            "ballsBowled": "$ballsBowled",
                            "runsScored": "$runsScored",
                            "runsConceded": "$runsConceded"}
    
    projectionCriteria.update(tournamentCriteria)
    stageTeamsPipeline.append({"$project": projectionCriteria})

    stageTeamsData = list(stageTeams_collection.aggregate(stageTeamsPipeline))

    if tournament["format"] == "TEST":
        for team in stageTeamsData:
            team["totalPointsContested"] = team["played"] * 12

            team["pointsPercentage"] = 0 if (team["totalPointsContested"] == 0) else ((team["points"] - team["deductionPoints"]) / team["totalPointsContested"]) * 100
    else:
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

    if tournament["format"] == "TEST":
        sort_key = lambda team: (
            team.get("played", 0) == 0,
            -team.get("pointsPercentage", 0),
        )
    else:
        sort_key = lambda team: (
            team.get("played", 0) == 0,
            -team.get("points", 0),
            -team.get("netRunRate", 0),
        )

    for stage in sorted_standings:
        groups = stage["groups"]

        # Sort group keys (A-Z, 1-9 correctly)
        sorted_group_keys = sorted(groups.keys(), key=lambda x: (not x.isdigit(), x))

        # Rebuild groups in sorted order
        stage["groups"] = {
            group_key: sorted(
                groups[group_key],
                key=sort_key
            )
            for group_key in sorted_group_keys
        }

    return {"standings": sorted_standings, "category": tournament["category"]}

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

            standings = get_tournament_standings_data(tournamentId, [stageOrder - 1])
            prevStageGroups = standings["standings"][0]["groups"]

            for team in stageTeams:
                group_name = team.get("teamFromStandingsGroup", "LEAGUE")

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
                        standings = get_tournament_standings_data(tournamentId, [stageOrder - 1])
                        prevStageGroups = standings["standings"][0]["groups"]
                    
                    group_name = team.get("teamFromStandingsGroup", "LEAGUE")
                    
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

    previousStageStandings = get_tournament_standings_data(tournamentId, [stageOrder - 1])
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

    previousStageStandings = get_tournament_standings_data(tournamentId, [stageOrder - 1])

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
    standings = get_tournament_standings_data(tournamentId, [stageOrder - 1])
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
    standings = get_tournament_standings_data(tournamentId, [stageOrder - 1])
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
        
def propagate_match_simulation(tournament_id, stageToSim):
    not_finished_matches = list(matches_collection.find({
           "tournamentId": tournament_id,
           "stageId": ObjectId(stageToSim["_id"]),
           "result": "None"
    }))
    
    if len(not_finished_matches) > 0 and not (stageToSim["name"] in ["Playoffs", "Semi-final"]):
        if verbose:
            print("{} matches are yet to be played in stage {}".format(len(not_finished_matches), stageToSim["name"]))
    else:
        if stageToSim["name"] == "Final":
            if verbose:
                print("Tournament {} has been simulated".format(tournament_id))
        else:
            if stageToSim["name"] != "Playoffs":
                stages_collection.update_one(
                    {"tournamentId": tournament_id, "order": stageToSim["order"] + 1},
                    {"$set": {"status": "active"}}
                )
                if verbose:
                    print("Stage {} for tournament {} is now active".format(stageToSim["order"] + 1, tournament_id))

            if stageToSim["name"] == "Playoffs":
                stage = stages_collection.find_one({"tournamentId": tournament_id, "order": stageToSim["order"]})
            else:
                stage = stages_collection.find_one({"tournamentId": tournament_id, "order": stageToSim["order"] + 1})

            while stage and stage["status"] == "active":
                confirmTeamsForStage(tournament_id, stage["order"])
                stage = stages_collection.find_one({"tournamentId": tournament_id, "order": stage["order"] + 1})

def _blank_match_fields(tournament, stage_type="group"):
    if tournament["name"] == "ICC World Test Championship":
        fields = {
            "result": "None",
            "tossResult": "Home-win",
            "tossDecision": "bat",
            "resultSummary": None,
        }
        if stage_type == "group":
            fields["homeDeductionPoints"] = 0
            fields["awayDeductionPoints"] = 0
        return fields

    max_balls = tournament["ballsPerInnings"]

    return {
        "homeTeamRuns": 0,
        "homeTeamWickets": 0,
        "homeTeamBalls": 0,
        "awayTeamRuns": 0,
        "awayTeamWickets": 0,
        "awayTeamBalls": 0,
        "homeMaxBalls": max_balls,
        "awayMaxBalls": max_balls,
        "target": None,
        "targetOvertaken": False,
        "tossResult": "Home-win",
        "tossDecision": "bat",
        "result": "None",
    }

def propagate_match_clear(earliest_stage, t_id, tournament):
    if earliest_stage["name"] == "Final":
        if verbose:
            print("Final has been reset")
    else:
        if earliest_stage["name"] == "Playoffs":
            confirmTeamsForStage(t_id, earliest_stage["order"])

        # 1. Find all stages that happen after the one being cleared
        future_stages = list(stages_collection.find({"tournamentId": t_id, "order": {"$gt": earliest_stage["order"]}}).sort("order", 1))
        isFirstNextStage = True

        for nextStage in future_stages:
            # 2. Lock the future stage since its prerequisite (the current stage) is now incomplete
            stages_collection.update_one(
                {"_id": ObjectId(nextStage["_id"])},
                {"$set": {"status": "locked"}}
            )

            # 3. Handle team slot assignments for the immediate next stage
            if earliest_stage["type"] != "group" and isFirstNextStage:
                # If we cleared a knockout match, dynamically re-calculate who qualifies for the next stage
                confirmTeamsForStage(t_id, nextStage["order"])
            else:
                # Otherwise, completely wipe all team stats and qualifications for future stages
                if nextStage["type"] == "group":
                    # Revert group stages back to their original pre-seeded teams (or null) and reset stats
                    stageTeams_collection.update_many(
                        {"tournamentId": t_id, "stageId": ObjectId(nextStage["_id"])},
                        [{"$set": {"teamId": {"$ifNull": ["$preseededTeamId", None]}, "confirmed": False,
                        "matchesPlayed": 0, "points": 0, "won": 0, "lost": 0, "noResult": 0,
                        "runsScored": 0, "runsConceded": 0, "ballsBowled": 0, "ballsFaced": 0}}]
                    )
                else:
                    # Clear knockout stage team slots entirely, omit runs and balls fields for ICC WTC
                    if tournament["name"] == "ICC World Test Championship":
                        stageTeams_collection.update_many(
                            {"tournamentId": t_id, "stageId": ObjectId(nextStage["_id"])},
                            [{"$set": {"teamId": None, "confirmed": False}}]
                        )
                    else:
                        stageTeams_collection.update_many(
                            {"tournamentId": t_id, "stageId": ObjectId(nextStage["_id"])},
                            [{"$set": {"teamId": None, "confirmed": False,
                            "runsScored": 0, "runsConceded": 0, "ballsBowled": 0, "ballsFaced": 0}}]
                        )

            # 4. Wipe all match scorecards in the future stage back to 0-0
            matches_collection.update_many(
                {"tournamentId": t_id, "stageId": ObjectId(nextStage["_id"])},
                {"$set": _blank_match_fields(tournament, nextStage["type"])}
            )          
            isFirstNextStage = False

def build_clear_filter(t_id, mode, stage_order, match_nums):
    if mode == "all":
        filter_query = {"tournamentId": t_id}
    elif mode == "stage":
        stage = stages_collection.find_one({"tournamentId": t_id, "order": stage_order})
        if not stage:
            raise ValueError("Stage not found")
        filter_query = {"tournamentId": t_id, "stageId": ObjectId(stage["_id"])}
    elif mode == "match-numbers":
        filter_query = {"tournamentId": t_id, "matchNumber": {"$in": list(map(int, match_nums.split(",")))}}
    filter_query["status"] = "incomplete"
    return filter_query

def fetch_matches_with_stage_type(filter_query):
    matches = list(matches_collection.aggregate([
        {"$match": filter_query},
        {"$lookup": {"from": "stages", "localField": "stageId", "foreignField": "_id", "as": "stage"}},
        {"$unwind": "$stage"},
        {"$set": {"stageType": "$stage.type"}}
    ]))
    if not matches:
        abort(404, description="No matches found")
    return matches

def commit_and_propagate_match_clear(tournament, t_id, matches, team_acc):
    match_numbers = [m["matchNumber"] for m in matches]

    operations = [
        UpdateOne({"_id": ObjectId(team_id)}, {"$inc": dict(inc_fields)})
        for team_id, inc_fields in team_acc.items() if team_id is not None
    ]

    if operations:
        stageTeams_collection.bulk_write(operations)

    match_ops = [
        UpdateOne(
            {"_id": m["_id"]},
            {"$set": _blank_match_fields(tournament, m["stageType"])}
        )
        for m in matches
    ]

    if match_ops:
        matches_collection.bulk_write(match_ops)

    all_stage_ids = {ObjectId(m["stageId"]) for m in matches}
    stages_info = list(stages_collection.find({"_id": {"$in": list(all_stage_ids)}}))
    if not stages_info:
        abort(404, description="No stages found for cleared matches")

    earliest_stage = min(stages_info, key=lambda x: x["order"])
    propagate_match_clear(earliest_stage, t_id, tournament)

def get_match_with_toss_guard(id, match_num, action_name):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        abort(404, description="Match not found")
    if match["tossResult"] == "None":
       abort(400, description=f"Toss result must be set before {action_name}")
    return match

def compute_nrr_contribution(match):
    """Mirrors update_score's NRR math. Returns per-team runs/balls contribution
    for the match's *current* stored score/toss/target/maxBalls, or None if no score exists yet."""
    has_score = match["homeTeamBalls"] > 0 and match["awayTeamBalls"] > 0
    if not has_score:
        return None

    toss_result = match["tossResult"]
    toss_decision = match["tossDecision"]
    home_batted_first = (toss_result == "Home-win" and toss_decision == "bat") or \
                        (toss_result == "Away-win" and toss_decision == "bowl")
    target = match["target"]

    def home_balls_nrr(wickets_val, balls_val):
        if target is not None and home_batted_first:
            return match["awayMaxBalls"]
        return match["homeMaxBalls"] if int(wickets_val) == 10 else int(balls_val)

    def away_balls_nrr(wickets_val, balls_val):
        if target is not None and not home_batted_first:
            return match["homeMaxBalls"]
        return match["awayMaxBalls"] if int(wickets_val) == 10 else int(balls_val)

    home_runs = (target - 1) if (target is not None and home_batted_first) else match["homeTeamRuns"]
    away_runs = (target - 1) if (target is not None and not home_batted_first) else match["awayTeamRuns"]

    hB = home_balls_nrr(match["homeTeamWickets"], match["homeTeamBalls"])
    aB = away_balls_nrr(match["awayTeamWickets"], match["awayTeamBalls"])

    return {
        "home": {"runsScored": home_runs, "runsConceded": away_runs, "ballsFaced": hB, "ballsBowled": aB},
        "away": {"runsScored": away_runs, "runsConceded": home_runs, "ballsFaced": aB, "ballsBowled": hB},
    }

def apply_nrr_contribution(match, mode):
    """mode: 'Apply' adds the contribution, 'Undo' subtracts it."""
    contribution = compute_nrr_contribution(match)
    if contribution is None:
        return

    m = 1 if mode == "Apply" else -1

    stageTeams_collection.update_one(
        {"_id": ObjectId(match["homeStageTeamId"])},
        {"$inc": {
            "runsScored": m * contribution["home"]["runsScored"],
            "runsConceded": m * contribution["home"]["runsConceded"],
            "ballsFaced": m * contribution["home"]["ballsFaced"],
            "ballsBowled": m * contribution["home"]["ballsBowled"],
        }}
    )
    stageTeams_collection.update_one(
        {"_id": ObjectId(match["awayStageTeamId"])},
        {"$inc": {
            "runsScored": m * contribution["away"]["runsScored"],
            "runsConceded": m * contribution["away"]["runsConceded"],
            "ballsFaced": m * contribution["away"]["ballsFaced"],
            "ballsBowled": m * contribution["away"]["ballsBowled"],
        }}
    )

def update_team_match_win(stageTeamId, points, mode):
    m = 1 if mode == "Apply" else -1
    stageTeams_collection.update_one(
        {"_id": ObjectId(stageTeamId)},
        {"$inc": {"won": m, "points": m*points, "matchesPlayed": m}}
    )

def update_team_match_loss(stageTeamId, mode):
    m = 1 if mode == "Apply" else -1
    stageTeams_collection.update_one(
        {"_id": ObjectId(stageTeamId)},
        {"$inc": {"lost": m, "matchesPlayed": m}}
    )

def update_team_match_no_result(stageTeamId, points, mode):
    m = 1 if mode == "Apply" else -1
    stageTeams_collection.update_one(
        {"_id": ObjectId(stageTeamId)},
        {"$inc": {"noResult": m, "matchesPlayed": m, "points": m*points}}
    )

def update_team_match_draw(stageTeamId, points, mode):
    m = 1 if mode == "Apply" else -1
    stageTeams_collection.update_one(
        {"_id": ObjectId(stageTeamId)},
        {"$inc": {"draw": m, "matchesPlayed": m, "points": m*points}}
    )

def update_team_match_tie(stageTeamId, points, mode):
    m = 1 if mode == "Apply" else -1
    stageTeams_collection.update_one(
        {"_id": ObjectId(stageTeamId)},
        {"$inc": {"tie": m, "matchesPlayed": m, "points": m*points}}
    )

def update_toss_field(tournament_id, match_num, field, value, field_label):
    tournament = find_tournament(tournament_id)

    match = matches_collection.find_one({"tournamentId": tournament_id, "matchNumber": int(match_num)})
    if not match:
        abort(404, description="No match found")

    if tournament["name"] != "ICC World Test Championship" and match["target"] is not None:
        abort(400, description=f"Toss {field_label} cannot be changed when target is entered")

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {field: value}}
    )

