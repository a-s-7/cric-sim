import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
import random
from collections import defaultdict

from utils import confirmTeamsForStage, get_tournament_standings, decide_playoff_no_result
from data.utils.tournamentsUtils import overs_to_balls

verbose = False

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


def update_result(id, match_num, result):
    if result not in ["Home-win", "Away-win", "No-result"]:
        raise ValueError("Invalid result value")

    match = matches_collection.find_one({"tournamentId": id, "matchNumber": match_num})
    if not match:
        raise ValueError("No match was found")

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

    update_db_result = matches_collection.update_one(
        {"tournamentId": id, "matchNumber": match_num},
        {"$set": {"result": result}},
    )

    if update_db_result.matched_count == 0:
        raise ValueError("No match was found")

    not_finished_matches = list(matches_collection.find({
        "tournamentId": id,
        "stageId": ObjectId(match["stageId"]),
        "result": "None"
    }))

    stageOfChangedMatch = stages_collection.find_one({"_id": ObjectId(match["stageId"])})

    if len(not_finished_matches) > 0 and not (stageOfChangedMatch["name"] in ["Playoffs", "Semi-final"]):
        if verbose:
            print("{} matches are yet to be played in stage {}".format(len(not_finished_matches), stageOfChangedMatch["name"]))
    else:
        if stageOfChangedMatch["name"] == "Final":
            if verbose:
                print("Tournament {} has been simulated".format(id))
        else:
            if stageOfChangedMatch["name"] != "Playoffs":
                stages_collection.update_one(
                    {"tournamentId": id, "order": stageOfChangedMatch["order"] + 1},
                    {"$set": {"status": "active"}}
                )

                if verbose:
                    print("Stage {} for tournament {} is now active".format(stageOfChangedMatch["order"] + 1, id))

            if stageOfChangedMatch["name"] == "Playoffs":
                stage = stages_collection.find_one({"tournamentId": id, "order": stageOfChangedMatch["order"]})
            else:
                stage = stages_collection.find_one({"tournamentId": id, "order": stageOfChangedMatch["order"] + 1})

            while stage and stage["status"] == "active":
                confirmTeamsForStage(id, stage["order"])
                stage = stages_collection.find_one({"tournamentId": id, "order": stage["order"] + 1})


def update_toss_result(id, match_num, toss_result):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        raise ValueError("Match not found")

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"tossResult": toss_result}}
    )


def update_toss_decision(id, match_num, toss_decision):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        raise ValueError("Match not found")

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"tossDecision": toss_decision}}
    )


def update_score(id, match_num, home_runs, home_wickets, home_overs, away_runs, away_wickets, away_overs):
    tournament = tournaments_collection.find_one({"_id": id})
    if not tournament:
        raise ValueError("Tournament not found")

    new_home_balls = overs_to_balls(str(home_overs))
    new_away_balls = overs_to_balls(str(away_overs))

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

    if old_match["result"] != "No-result":
        if tournament["format"] == "T20":
            max_balls = 120
        else:
            max_balls = 300

        hB = max_balls if old_match["homeTeamWickets"] == 10 else old_match["homeTeamBalls"]
        aB = max_balls if old_match["awayTeamWickets"] == 10 else old_match["awayTeamBalls"]

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["homeStageTeamId"])},
            {"$inc": {
                "runsScored":   int(home_runs)    - old_match["homeTeamRuns"],
                "runsConceded":  int(away_runs)    - old_match["awayTeamRuns"],
                "ballsBowled":  (max_balls if int(away_wickets) == 10 else new_away_balls) - aB,
                "ballsFaced":   (max_balls if int(home_wickets) == 10 else new_home_balls) - hB,
            }}
        )

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["awayStageTeamId"])},
            {"$inc": {
                "runsScored":   int(away_runs)    - old_match["awayTeamRuns"],
                "runsConceded":  int(home_runs)    - old_match["homeTeamRuns"],
                "ballsBowled":  (max_balls if int(home_wickets) == 10 else new_home_balls) - hB,
                "ballsFaced":   (max_balls if int(away_wickets) == 10 else new_away_balls) - aB,
            }}
        )


def clear_tournament_matches(id, mode, stage_order, match_nums):
    tournament = tournaments_collection.find_one({"_id": id})
    if not tournament:
        raise ValueError("Tournament not found")

    filter_query = {}
    if mode == "all":
        filter_query = {"tournamentId": id}
    elif mode == "stage":
        stage = stages_collection.find_one({"tournamentId": id, "order": stage_order})
        if not stage:
            raise ValueError("Stage not found")
        filter_query = {"tournamentId": id, "stageId": ObjectId(stage["_id"])}
    elif mode == "match-numbers":
        filter_query = {"tournamentId": id, "matchNumber": {"$in": list(map(int, match_nums.split(",")))}}

    matches = list(matches_collection.aggregate([
        {"$match": filter_query},
        {"$lookup": {"from": "stages", "localField": "stageId", "foreignField": "_id", "as": "stage"}},
        {"$unwind": "$stage"},
        {"$set": {"stageType": "$stage.type"}}
    ]))

    match_numbers = list(map(lambda x: x["matchNumber"], matches))
    team_acc = defaultdict(lambda: defaultdict(int))

    for match in matches:
        home_id = match["homeStageTeamId"]
        away_id = match["awayStageTeamId"]

        team_acc[home_id]["runsScored"] += -match["homeTeamRuns"]
        team_acc[home_id]["runsConceded"] += -match["awayTeamRuns"]

        if tournament["format"] == "T20":
            max_balls = 120
        else:
            max_balls = 300

        team_acc[home_id]["ballsBowled"] += -(max_balls if match["awayTeamWickets"] == 10 else match["awayTeamBalls"])
        team_acc[home_id]["ballsFaced"] += -(max_balls if match["homeTeamWickets"] == 10 else match["homeTeamBalls"])

        team_acc[away_id]["runsScored"] += -match["awayTeamRuns"]
        team_acc[away_id]["runsConceded"] += -match["homeTeamRuns"]

        team_acc[away_id]["ballsBowled"] += -(max_balls if match["homeTeamWickets"] == 10 else match["homeTeamBalls"])
        team_acc[away_id]["ballsFaced"] += -(max_balls if match["awayTeamWickets"] == 10 else match["awayTeamBalls"])

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
        UpdateOne({"_id": ObjectId(team_id)}, {"$inc": dict(inc_fields)})
        for team_id, inc_fields in team_acc.items() if team_id is not None
    ]

    if operations:
        stageTeams_collection.bulk_write(operations)

    result = matches_collection.update_many(
        {"tournamentId": id, "matchNumber": {"$in": match_numbers}},
        {"$set": { "homeTeamRuns": 0, "homeTeamWickets": 0, "homeTeamBalls": 0, "awayTeamRuns": 0, "awayTeamWickets": 0, "awayTeamBalls": 0, "result": "None" }}
    )

    if result.matched_count == 0:
        raise ValueError("No matches were found")

    all_stage_ids = {ObjectId(m["stageId"]) for m in matches}
    stages_info = list(stages_collection.find({"_id": {"$in": list(all_stage_ids)}}))
    if not stages_info:
        raise ValueError("No stages found for cleared matches")
        
    earliest_stage = min(stages_info, key=lambda x: x["order"])
    firstMostRecentStage = earliest_stage
    
    if firstMostRecentStage["name"] == "Final":
        if verbose:
            print("Final has been reset")
    else:
        if firstMostRecentStage["name"] == "Playoffs":
            confirmTeamsForStage(id, firstMostRecentStage["order"])

        future_stages = list(stages_collection.find({"tournamentId": id, "order": {"$gt": firstMostRecentStage["order"]}}).sort("order", 1))
        isFirstNextStage = True
        for nextStage in future_stages:
            stages_collection.update_one(
                {"_id": ObjectId(nextStage["_id"])},
                {"$set": {"status": "locked"}}
            )
            if firstMostRecentStage["type"] != "group" and isFirstNextStage:
                confirmTeamsForStage(id, nextStage["order"])
            else:
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
            isFirstNextStage = False

    return {"matched_count": result.matched_count, "modified_count": result.modified_count, "message": f"{result.matched_count} matched - {result.modified_count} modified: {id} matches cleared successfully"}


def simulate_tournament_matches(id, stage_num):
    stageToSim = stages_collection.find_one(
        {
            "tournamentId": id,
            "status": "active",
            "order": stage_num
        }
    )

    matches = list(matches_collection.find({
        "tournamentId": id,
        "stageId": ObjectId(stageToSim["_id"])
    }))

    team_updates = []
    match_updates = []

    for match in matches:
        result = random.choices(
            ["Home-win", "Away-win", "No-result"],
            weights=[0.45, 0.45, 0.10]
        )[0]

        if stageToSim["type"] == "group":
            home_id = ObjectId(match["homeStageTeamId"])
            away_id = ObjectId(match["awayStageTeamId"])
            old_result = match.get("result")

            if old_result == "Home-win":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"won": -1, "points": -2, "matchesPlayed": -1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"lost": -1, "matchesPlayed": -1}}))
            elif old_result == "Away-win":
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"won": -1, "points": -2, "matchesPlayed": -1}}))
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"lost": -1, "matchesPlayed": -1}}))
            elif old_result == "No-result":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": -1, "points": -1, "noResult": -1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": -1, "points": -1, "noResult": -1}}))

            if result == "Home-win":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"won": 1, "points": 2, "matchesPlayed": 1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"lost": 1, "matchesPlayed": 1}}))
            elif result == "Away-win":
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"won": 1, "points": 2, "matchesPlayed": 1}}))
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"lost": 1, "matchesPlayed": 1}}))
            elif result == "No-result":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": 1, "points": 1, "noResult": 1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": 1, "points": 1, "noResult": 1}}))

        match_updates.append(UpdateOne({"_id": match["_id"]}, {"$set": {"result": result}}))

    if team_updates:
        stageTeams_collection.bulk_write(team_updates)

    if match_updates:
        matches_collection.bulk_write(match_updates)    

    if stageToSim["name"] == "Final":
        if verbose:
            print("Tournament {} has been simulated".format(id))
    else:
        if stageToSim["name"] != "Playoffs":
            stages_collection.update_one(
                {"tournamentId": id, "order": stageToSim["order"] + 1},
                {"$set": {"status": "active"}}
            )
            if verbose:
                print("Stage {} for tournament {} is now active".format(stageToSim["order"] + 1, id))

        if stageToSim["name"] == "Playoffs":
            stage = stages_collection.find_one({"tournamentId": id, "order": stageToSim["order"]})
        else:
            stage = stages_collection.find_one({"tournamentId": id, "order": stageToSim["order"] + 1})

        while stage and stage["status"] == "active":
            confirmTeamsForStage(id, stage["order"])
            stage = stages_collection.find_one({"tournamentId": id, "order": stage["order"] + 1})

    return {"message": f"Tournament id {id} stage {stageToSim['name']} simulated successfully"}

def update_match_status(id, match_num, status):
    matches_collection.update_one(
        {"tournamentId": id, "matchNumber": int(match_num)},
        {"$set": {"status": status}}
    )
    return {"message": f"Match {match_num} for tournament {id} updated successfully"}