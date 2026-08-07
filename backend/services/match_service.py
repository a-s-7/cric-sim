import difflib
from re import match
from datetime import timezone
from asyncio import mixins
import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
import random
from collections import defaultdict

from utils import confirmTeamsForStage, get_tournament_standings, decide_playoff_no_result, is_gemini_quota_error
from data.utils.tournamentsUtils import overs_to_balls
from agent.pipeline import run_match_result_agent
from datetime import datetime, timedelta


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
verbose = False

def _get_match_with_toss_guard(id, match_num, action_name):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        raise ValueError("Match not found")
    if match["tossResult"] == "None":
        raise ValueError(f"Toss result must be set before {action_name}")
    return match


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

def _blank_match_fields(tournament):
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

def _compute_nrr_contribution(match):
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


def _apply_nrr_contribution(match, mode):
    """mode: 'Apply' adds the contribution, 'Undo' subtracts it."""
    contribution = _compute_nrr_contribution(match)
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

def update_result(id, match_num, result):
    tournament = tournaments_collection.find_one({"_id": id})
    pointsPerWin = 4 if tournament["format"] == "HUNDRED" else 2
    pointsPerNoResult = 2 if tournament["format"] == "HUNDRED" else 1

    if result not in ["Home-win", "Away-win", "No-result"]:
        raise ValueError("Invalid result value")

    match = _get_match_with_toss_guard(id, match_num, "updating the match result")

    matchStage = stages_collection.find_one({"_id": ObjectId(match["stageId"])})

    if matchStage["type"] == "group":
        # Undo the previous result
        if match["result"] == "Home-win":
            update_team_match_win(match["homeStageTeamId"], pointsPerWin, "Undo")
            update_team_match_loss(match["awayStageTeamId"], "Undo")
        elif match["result"] == "Away-win":
            update_team_match_win(match["awayStageTeamId"], pointsPerWin, "Undo")
            update_team_match_loss(match["homeStageTeamId"], "Undo")
        elif match["result"] == "No-result":
            update_team_match_no_result(match["homeStageTeamId"], pointsPerNoResult, "Undo")
            update_team_match_no_result(match["awayStageTeamId"], pointsPerNoResult, "Undo")

        # Apply the new result
        if result == "Home-win":
            update_team_match_win(match["homeStageTeamId"], pointsPerWin, "Apply")
            update_team_match_loss(match["awayStageTeamId"], "Apply")
        elif result == "Away-win":
            update_team_match_win(match["awayStageTeamId"], pointsPerWin, "Apply")
            update_team_match_loss(match["homeStageTeamId"], "Apply")
        elif result == "No-result":
            update_team_match_no_result(match["homeStageTeamId"], pointsPerNoResult, "Apply")
            update_team_match_no_result(match["awayStageTeamId"], pointsPerNoResult, "Apply")

        
        # NRR fields only apply when result isn't No-result. Undo/apply the contribution
        # whenever this change crosses the No-result boundary.
        was_active = match["result"] in ["Home-win", "Away-win"]
        will_be_active = result in ["Home-win", "Away-win"]

        if was_active and not will_be_active:
            _apply_nrr_contribution(match, "Undo")
        elif not was_active and will_be_active:
            _apply_nrr_contribution(match, "Apply")

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

def update_target_runs(id, match_num, target_runs):
    match = _get_match_with_toss_guard(id, match_num, "updating the target")
    
    old_target = match["target"]
    
    # 1. Save the new target to MongoDB
    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"target": target_runs}}
    )

    if match["result"] in ["Home-win", "Away-win"]:
        has_score = match["homeTeamBalls"] > 0 and match["awayTeamBalls"] > 0
        
        if has_score:
            # Determine who batted first
            toss_result = match["tossResult"]
            toss_decision = match["tossDecision"]
            
            home_batted_first = (toss_result == "Home-win" and toss_decision == "bat") or \
                                (toss_result == "Away-win" and toss_decision == "bowl")
            
            batting_first_id = match["homeStageTeamId"] if home_batted_first else match["awayStageTeamId"]
            batting_second_id = match["awayStageTeamId"] if home_batted_first else match["homeStageTeamId"]
            
            first_team_actual_runs = match["homeTeamRuns"] if home_batted_first else match["awayTeamRuns"]
            
            # Calculate old and new effective runs for the team batting first
            old_effective = (old_target - 1) if old_target is not None else first_team_actual_runs
            new_effective = (target_runs - 1) if target_runs is not None else first_team_actual_runs
            
            delta = new_effective - old_effective
            
            if delta != 0:
                stageTeams_collection.update_one(
                    {"_id": ObjectId(batting_first_id)},
                    {"$inc": {"runsScored": delta}}
                )
                stageTeams_collection.update_one(
                    {"_id": ObjectId(batting_second_id)},
                    {"$inc": {"runsConceded": delta}}
                )

            # DLS rule: the batting-first team is credited with the overs allowed to the
            # batting-second team. Adjust ballsFaced/ballsBowled when a target is added or removed.
            first_team_wickets = match["homeTeamWickets"] if home_batted_first else match["awayTeamWickets"]
            first_team_actual_balls = match["homeTeamBalls"] if home_batted_first else match["awayTeamBalls"]
            first_team_max_balls = match["homeMaxBalls"] if home_batted_first else match["awayMaxBalls"]

            second_team_max_balls = match["awayMaxBalls"] if home_batted_first else match["homeMaxBalls"]

            # With a DLS target: batting-first team is always credited with the 2nd innings over limit.
            # Without a DLS target: standard NRR applies — all out uses the full over allocation,
            # otherwise use actual balls. Wickets only matter in this non-DLS fallback.
            
            nrr_balls = first_team_max_balls if first_team_wickets == 10 else first_team_actual_balls

            old_balls_nrr = second_team_max_balls if old_target is not None else nrr_balls
            new_balls_nrr = second_team_max_balls if target_runs is not None else nrr_balls

            balls_delta = new_balls_nrr - old_balls_nrr

            if balls_delta != 0:
                stageTeams_collection.update_one(
                    {"_id": ObjectId(batting_first_id)},
                    {"$inc": {"ballsFaced": balls_delta}}
                )
                stageTeams_collection.update_one(
                    {"_id": ObjectId(batting_second_id)},
                    {"$inc": {"ballsBowled": balls_delta}}
                )

def update_score(id, match_num, home_runs, home_wickets, home_balls, away_runs, away_wickets, away_balls):
    tournament = tournaments_collection.find_one({"_id": id})
    if not tournament:
        raise ValueError("Tournament not found")

    new_home_balls = int(home_balls)
    new_away_balls = int(away_balls)

    # Safety guard: fetch before writing — toss must be set before a score can be recorded.
    _get_match_with_toss_guard(id, match_num, "updating the score")

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
        toss_result = old_match["tossResult"]
        toss_decision = old_match["tossDecision"]
            
        home_batted_first = (toss_result == "Home-win" and toss_decision == "bat") or \
                            (toss_result == "Away-win" and toss_decision == "bowl")

        target = old_match["target"]

        # DLS rule: the team batting first is credited with the overs allowed to the
        # team batting second (awayMaxBalls if home batted first, homeMaxBalls otherwise).
        # When no DLS target exists, fall back to actual balls faced (or maxBalls if all-out).
        def home_balls_nrr(wickets_val, balls_val):
            """NRR balls for the home team's innings."""
            if target is not None and home_batted_first:
                return old_match["awayMaxBalls"]  # DLS: credit home with 2nd-innings limit
            return old_match["homeMaxBalls"] if int(wickets_val) == 10 else int(balls_val)

        def away_balls_nrr(wickets_val, balls_val):
            """NRR balls for the away team's innings."""
            if target is not None and not home_batted_first:
                return old_match["homeMaxBalls"]  # DLS: credit away with 2nd-innings limit
            return old_match["awayMaxBalls"] if int(wickets_val) == 10 else int(balls_val)

        # Old ball baselines for delta calculation
        # 1. TypeError guard: Only use target - 1 if target is not None
        # 2. Standings guard: If score wasn't committed yet (balls == 0), previous runs/balls contribution was 0
        old_score_exists = old_match["homeTeamBalls"] > 0 and old_match["awayTeamBalls"] > 0

        hB = home_balls_nrr(old_match["homeTeamWickets"], old_match["homeTeamBalls"]) if old_score_exists else 0
        aB = away_balls_nrr(old_match["awayTeamWickets"], old_match["awayTeamBalls"]) if old_score_exists else 0

        old_home_runs = (
            0 if not old_score_exists 
            else ((target - 1) if (target is not None and home_batted_first) else old_match["homeTeamRuns"])
        )
        old_away_runs = (
            0 if not old_score_exists 
            else ((target - 1) if (target is not None and not home_batted_first) else old_match["awayTeamRuns"])
        )

        new_home_runs = (target - 1) if (target is not None and home_batted_first) else int(home_runs)
        new_away_runs = (target - 1) if (target is not None and not home_batted_first) else int(away_runs)

        new_hB = home_balls_nrr(home_wickets, new_home_balls)
        new_aB = away_balls_nrr(away_wickets, new_away_balls)

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["homeStageTeamId"])},
            {"$inc": {
                "runsScored":   new_home_runs - old_home_runs,
                "runsConceded":  new_away_runs - old_away_runs,
                "ballsBowled":  new_aB - aB,
                "ballsFaced":   new_hB - hB,
            }}
        )

        stageTeams_collection.update_one(
            {"_id": ObjectId(old_match["awayStageTeamId"])},
            {"$inc": {
                "runsScored":   new_away_runs - old_away_runs,
                "runsConceded":  new_home_runs - old_home_runs,
                "ballsBowled":  new_hB - hB,
                "ballsFaced":   new_aB - aB,
            }}
        )


def update_max_balls(id, match_num, team, max_balls):
    max_balls = int(max_balls)

    # Safety guard: fetch before writing — toss must be set before max balls can be adjusted.
    _get_match_with_toss_guard(id, match_num, "updating max balls")

    old_match = matches_collection.find_one_and_update(
        {"tournamentId": id, "matchNumber": int(match_num)},
        {"$set": {"{team}MaxBalls".format(team=team): max_balls}},
        return_document=False
    )

    if not old_match:
        raise ValueError("Match not found")

    if old_match["result"] != "No-result":
        target = old_match["target"]
        has_score = old_match["homeTeamBalls"] > 0 and old_match["awayTeamBalls"] > 0

        toss_result = old_match["tossResult"]
        toss_decision = old_match["tossDecision"]
        home_batted_first = (toss_result == "Home-win" and toss_decision == "bat") or \
                            (toss_result == "Away-win" and toss_decision == "bowl")

        if team == "home":
            diff = max_balls - old_match["homeMaxBalls"]

            # DLS: homeMaxBalls is the 2nd innings limit when away batted first.
            # Changing it adjusts the NRR credit for the away (batting-first) team.
            if has_score and target is not None and not home_batted_first:
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["awayStageTeamId"])},
                    {"$inc": {"ballsFaced": diff}}
                )
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["homeStageTeamId"])},
                    {"$inc": {"ballsBowled": diff}}
                )

            # Standard NRR: home all out uses homeMaxBalls. Skip if a DLS target is set and
            # home batted first — in that case home's NRR uses awayMaxBalls, not homeMaxBalls.
            # Safe to run without checking if overs are entered yet, because the database wickets
            # count remains 0 (or previously saved value) until the complete score is submitted.
            if old_match["homeTeamWickets"] == 10 and not (target is not None and home_batted_first):
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["homeStageTeamId"])},
                    {"$inc": {"ballsFaced": diff}}
                )
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["awayStageTeamId"])},
                    {"$inc": {"ballsBowled": diff}}
                )

        elif team == "away":
            diff = max_balls - old_match["awayMaxBalls"]

            # DLS: awayMaxBalls is the 2nd innings limit when home batted first.
            # Changing it adjusts the NRR credit for the home (batting-first) team.
            if has_score and target is not None and home_batted_first:
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["homeStageTeamId"])},
                    {"$inc": {"ballsFaced": diff}}
                )
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["awayStageTeamId"])},
                    {"$inc": {"ballsBowled": diff}}
                )

            # Standard NRR: away all out uses awayMaxBalls. Skip if a DLS target is set and
            # away batted first — in that case away's NRR uses homeMaxBalls, not awayMaxBalls.
            if old_match["awayTeamWickets"] == 10 and not (target is not None and not home_batted_first):
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["awayStageTeamId"])},
                    {"$inc": {"ballsFaced": diff}}
                )
                stageTeams_collection.update_one(
                    {"_id": ObjectId(old_match["homeStageTeamId"])},
                    {"$inc": {"ballsBowled": diff}}
                )

    return {"message": f"Match {match_num} for tournament {id} {team} max balls updated successfully"}


def clear_tournament_matches(id, mode, stage_order, match_nums):
    tournament = tournaments_collection.find_one({"_id": id})
    pointsPerWin = 4 if tournament["format"] == "HUNDRED" else 2
    pointsPerNoResult = 2 if tournament["format"] == "HUNDRED" else 1

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

    filter_query["status"] = "incomplete"

    matches = list(matches_collection.aggregate([
        {"$match": filter_query},
        {"$lookup": {"from": "stages", "localField": "stageId", "foreignField": "_id", "as": "stage"}},
        {"$unwind": "$stage"},
        {"$set": {"stageType": "$stage.type"}}
    ]))

    if len(matches) == 0:
        return {"message": "No matches found"}

    match_numbers = list(map(lambda x: x["matchNumber"], matches))
    team_acc = defaultdict(lambda: defaultdict(int))

    for match in matches:
        target = match["target"]
        has_score = match["homeTeamBalls"] > 0 and match["awayTeamBalls"] > 0

        toss_result = match["tossResult"]
        toss_decision = match["tossDecision"]
        
        toss_known = toss_result != "None" and toss_decision != "None"
        home_batted_first = toss_known and (
            (toss_result == "Home-win" and toss_decision == "bat") or
            (toss_result == "Away-win" and toss_decision == "bowl")
        )

        home_id = match["homeStageTeamId"]
        away_id = match["awayStageTeamId"]

        if has_score and toss_known and match["result"] != "No-result":
            home_runs = (target - 1) if (target is not None and home_batted_first) else match["homeTeamRuns"]
            away_runs = (target - 1) if (target is not None and not home_batted_first) else match["awayTeamRuns"]

            def home_balls_nrr(wickets, balls):
                if target is not None and home_batted_first:
                    return match["awayMaxBalls"]
                return match["homeMaxBalls"] if wickets == 10 else balls

            def away_balls_nrr(wickets, balls):
                if target is not None and not home_batted_first:
                    return match["homeMaxBalls"]
                return match["awayMaxBalls"] if wickets == 10 else balls

            hB = home_balls_nrr(match["homeTeamWickets"], match["homeTeamBalls"])
            aB = away_balls_nrr(match["awayTeamWickets"], match["awayTeamBalls"])

            team_acc[home_id]["runsScored"] += -home_runs
            team_acc[home_id]["runsConceded"] += -away_runs

            team_acc[away_id]["runsScored"] += -away_runs
            team_acc[away_id]["runsConceded"] += -home_runs

            team_acc[home_id]["ballsFaced"] += -hB
            team_acc[home_id]["ballsBowled"] += -aB

            team_acc[away_id]["ballsFaced"] += -aB
            team_acc[away_id]["ballsBowled"] += -hB

        if match["stageType"] == "group":
            if match["result"] == "Home-win":
                team_acc[home_id]["won"] += -1
                team_acc[home_id]["points"] += -pointsPerWin
                team_acc[home_id]["matchesPlayed"] += -1
                team_acc[away_id]["lost"] += -1
                team_acc[away_id]["matchesPlayed"] += -1
            elif match["result"] == "Away-win":
                team_acc[away_id]["won"] += -1
                team_acc[away_id]["points"] += -pointsPerWin
                team_acc[away_id]["matchesPlayed"] += -1
                team_acc[home_id]["lost"] += -1
                team_acc[home_id]["matchesPlayed"] += -1
            elif match["result"] == "No-result":
                team_acc[home_id]["matchesPlayed"] += -1
                team_acc[home_id]["points"] += -pointsPerNoResult
                team_acc[home_id]["noResult"] += -1
                team_acc[away_id]["matchesPlayed"] += -1
                team_acc[away_id]["points"] += -pointsPerNoResult
                team_acc[away_id]["noResult"] += -1
        
    operations = [
        UpdateOne({"_id": ObjectId(team_id)}, {"$inc": dict(inc_fields)})
        for team_id, inc_fields in team_acc.items() if team_id is not None
    ]

    if operations:
        stageTeams_collection.bulk_write(operations)

    result = matches_collection.update_many(
        {"tournamentId": id, "matchNumber": {"$in": match_numbers}},
        {"$set": _blank_match_fields(tournament)}
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

        # 1. Find all stages that happen after the one being cleared
        future_stages = list(stages_collection.find({"tournamentId": id, "order": {"$gt": firstMostRecentStage["order"]}}).sort("order", 1))
        isFirstNextStage = True
        
        for nextStage in future_stages:
            # 2. Lock the future stage since its prerequisite (the current stage) is now incomplete
            stages_collection.update_one(
                {"_id": ObjectId(nextStage["_id"])},
                {"$set": {"status": "locked"}}
            )
            
            # 3. Handle team slot assignments for the immediate next stage
            if firstMostRecentStage["type"] != "group" and isFirstNextStage:
                # If we cleared a knockout match, dynamically re-calculate who qualifies for the next stage
                confirmTeamsForStage(id, nextStage["order"])
            else:
                # Otherwise, completely wipe all team stats and qualifications for future stages
                if nextStage["type"] == "group":
                    # Revert group stages back to their original pre-seeded teams (or null) and reset stats
                    stageTeams_collection.update_many(
                        {"tournamentId": id, "stageId": ObjectId(nextStage["_id"])},
                        [{"$set": {"teamId": {"$ifNull": ["$preseededTeamId", None]}, "confirmed": False,
                        "matchesPlayed": 0, "points": 0, "won": 0, "lost": 0, "noResult": 0,
                        "runsScored": 0, "runsConceded": 0, "ballsBowled": 0, "ballsFaced": 0}}]
                    )
                else:
                    # Clear knockout stage slots entirely (teamId: None) and reset stats
                    stageTeams_collection.update_many(
                        {"tournamentId": id, "stageId": ObjectId(nextStage["_id"])},
                        [{"$set": {"teamId": None, "confirmed": False,
                        "runsScored": 0, "runsConceded": 0, "ballsBowled": 0, "ballsFaced": 0}}]
                    )
            
            # 4. Wipe all match scorecards in the future stage back to 0-0
            matches_collection.update_many(
                {"tournamentId": id, "stageId": ObjectId(nextStage["_id"])},
                {"$set": _blank_match_fields(tournament)}
            )          
            isFirstNextStage = False

    return {"matched_count": result.matched_count, "modified_count": result.modified_count, "message": f"{result.matched_count} matched - {result.modified_count} modified: {id} matches cleared successfully"}

def abandon_match(id, match_num):
    clear_tournament_matches(id, "match-numbers", None, str(match_num))
    
    update_result(id, match_num, "No-result")

    matches_collection.update_one(
        {"tournamentId": id, "matchNumber": int(match_num)},
        {"$set": {"tossResult": "None", "tossDecision": "None"}}
    )
    
    return {"message": f"Match {match_num} for tournament {id} abandoned successfully"}

def update_match_status_and_toss(id, match_num, status=None, toss_result=None, toss_decision=None):
    update_fields = {}
    if status is not None:
        update_fields["status"] = status
    if toss_result is not None:
        update_fields["tossResult"] = toss_result
    if toss_decision is not None:
        update_fields["tossDecision"] = toss_decision

    if not update_fields:
        return {"message": "No fields to update"}

    result = matches_collection.update_one(
        {"tournamentId": id, "matchNumber": int(match_num)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise ValueError("Match not found")
    return {"message": f"Match {match_num} for tournament {id} updated successfully"}

def update_toss_result(id, match_num, toss_result):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        raise ValueError("Match not found")
    elif match["target"] != None:
        raise ValueError("Toss result cannot be changed when target is entered")

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"tossResult": toss_result}}
    )

def update_toss_decision(id, match_num, toss_decision):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        raise ValueError("Match not found")
    elif match["target"] != None:
        raise ValueError("Toss decision cannot be changed when target is entered")

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"tossDecision": toss_decision}}
    )

def update_status(id, match_num, status):
    match = matches_collection.find_one({"tournamentId": id, "matchNumber": int(match_num)})
    if not match:
        raise ValueError("Match not found")

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"status": status}}
    )

def simulate_tournament_matches(id, stage_num):
    tournament = tournaments_collection.find_one({"_id": id})
    pointsPerWin = 4 if tournament["format"] == "HUNDRED" else 2
    pointsPerNoResult = 2 if tournament["format"] == "HUNDRED" else 1

    stageToSim = stages_collection.find_one(
        {
            "tournamentId": id,
            "status": "active",
            "order": stage_num
        }
    )

    matches = list(matches_collection.find({
        "tournamentId": id,
        "status" : "incomplete",
        "stageId": ObjectId(stageToSim["_id"])
    }))

    team_updates = []
    match_updates = []

    for match in matches:
        result = random.choices(
            ["Home-win", "Away-win", "No-result"],
            weights=[0.475, 0.475, 0.05]
        )[0]

        if stageToSim["type"] == "group":
            home_id = ObjectId(match["homeStageTeamId"])
            away_id = ObjectId(match["awayStageTeamId"])
            old_result = match.get("result")

            if old_result == "Home-win":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"won": -1, "points": -pointsPerWin, "matchesPlayed": -1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"lost": -1, "matchesPlayed": -1}}))
            elif old_result == "Away-win":
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"won": -1, "points": -pointsPerWin, "matchesPlayed": -1}}))
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"lost": -1, "matchesPlayed": -1}}))
            elif old_result == "No-result":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": -1, "points": -pointsPerNoResult, "noResult": -1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": -1, "points": -pointsPerNoResult, "noResult": -1}}))

            if result == "Home-win":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"won": 1, "points": pointsPerWin, "matchesPlayed": 1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"lost": 1, "matchesPlayed": 1}}))
            elif result == "Away-win":
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"won": 1, "points": pointsPerWin, "matchesPlayed": 1}}))
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"lost": 1, "matchesPlayed": 1}}))
            elif result == "No-result":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": 1, "points": pointsPerNoResult, "noResult": 1}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": 1, "points": pointsPerNoResult, "noResult": 1}}))

        match_updates.append(UpdateOne({"_id": match["_id"]}, {"$set": {"result": result}}))

    if team_updates:
        stageTeams_collection.bulk_write(team_updates)

    if match_updates:
        matches_collection.bulk_write(match_updates)    

    not_finished_matches = list(matches_collection.find({
        "tournamentId": id,
        "stageId": ObjectId(stageToSim["_id"]),
        "result": "None"
    }))

    if len(not_finished_matches) > 0 and not (stageToSim["name"] in ["Playoffs", "Semi-final"]):
        if verbose:
            print("{} matches are yet to be played in stage {}".format(len(not_finished_matches), stageToSim["name"]))
    else:
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

def run_match_update(tournament_id=None, match_num=None):
    if tournament_id is not None and match_num is not None:
        matches = [matches_collection.find_one({
            "tournamentId": tournament_id,
            "matchNumber": int(match_num)
        })]
    else:
        # Find all real-world tournaments
        rw_tournaments = tournaments_collection.find({"mode": "real-world"})
        rw_tournament_ids = [t["_id"] for t in rw_tournaments]

        matches = matches_collection.find({
            "tournamentId": {"$in": rw_tournament_ids},
            "endDate": {"$lt": datetime.now(timezone.utc)},
            "autoUpdate": True,
            "status": "incomplete"
        }).sort("endDate", 1)

    result = []

    for match in matches:
        try:
            res = run_match_result_agent(match["tournamentId"], match["matchNumber"])
            result.append(res)
        except Exception as e:
            if tournament_id is not None and match_num is not None:
                raise
            # In batch mode, only propagate quota errors; skip other per-match failures.
            if is_gemini_quota_error(e):
                raise
            result.append({"error": str(e)})

    return result
    

def update_target_overtake_status(id, match_num, target_overtaken):
    match = _get_match_with_toss_guard(id, match_num, "updating target overtaken status")

    if isinstance(target_overtaken, str):
        target_overtaken = target_overtaken.lower() == "true"

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"targetOvertaken": target_overtaken}}
    )

    return {"message": f"Match {match_num} for tournament {id} updated successfully"}

