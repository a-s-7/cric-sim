from flask import abort
from re import match
from datetime import timezone
import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId
import random
from collections import defaultdict

from utils import ( 
                is_gemini_quota_error, 
                propagate_match_simulation,
                build_clear_filter,
                fetch_matches_with_stage_type,
                commit_and_propagate_match_clear,
                get_match_with_toss_guard,
                find_tournament,
                apply_nrr_contribution,
                update_team_match_win,
                update_team_match_loss,
                update_team_match_no_result,
                update_team_match_draw,
                update_team_match_tie)

from agent.pipeline import run_match_result_agent
from datetime import datetime

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

# Methods: Update match result
def update_match_result(tournament_id, match_num, result):
    tournament = find_tournament(tournament_id)

    if tournament["name"] == "ICC World Test Championship":
        update_wtc_match_result(tournament, match_num, result)
    else:
        update_tournament_match_result(tournament, match_num, result)

def update_wtc_match_result(tournament, match_num, result):
    t_id = tournament["_id"]

    pointsPerWin = 12 
    pointsPerTie = 6
    pointsPerDraw = 4

    if result not in ["Home-win", "Away-win", "Draw", "Tie"]:
        abort(400, description=f"Invalid match result")

    match = matches_collection.find_one({"tournamentId": t_id, "matchNumber": int(match_num)})
    matchStage = stages_collection.find_one({"_id": ObjectId(match["stageId"])})

    if matchStage["type"] == "group":
        # Undo the previous result
        mode = "Undo"
        if match["result"] == "Home-win":
            update_team_match_win(match["homeStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["awayStageTeamId"],mode)
        elif match["result"] == "Away-win":
            update_team_match_win(match["awayStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["homeStageTeamId"], mode)
        elif match["result"] == "Draw":
            update_team_match_draw(match["homeStageTeamId"], pointsPerDraw, mode)
            update_team_match_draw(match["awayStageTeamId"], pointsPerDraw, mode)
        elif match["result"] == "Tie":
            update_team_match_tie(match["homeStageTeamId"], pointsPerTie, mode)
            update_team_match_tie(match["awayStageTeamId"], pointsPerTie, mode)
        
        # Apply the new result
        mode = "Apply"
        if result == "Home-win":
            update_team_match_win(match["homeStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["awayStageTeamId"],mode)
        elif result == "Away-win":
            update_team_match_win(match["awayStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["homeStageTeamId"], mode)
        elif result == "Draw":
            update_team_match_draw(match["homeStageTeamId"], pointsPerDraw, mode)
            update_team_match_draw(match["awayStageTeamId"], pointsPerDraw, mode)
        elif match["result"] == "Tie":
            update_team_match_tie(match["homeStageTeamId"], pointsPerTie, mode)
            update_team_match_tie(match["awayStageTeamId"], pointsPerTie, mode)


    update_db_result = matches_collection.update_one(
        {"tournamentId": t_id, "matchNumber": match_num},
        {"$set": {"result": result}},
    )

    if update_db_result.matched_count == 0:
        abort(404, description="No match was found")

    propagate_match_simulation(t_id, matchStage)

def update_tournament_match_result(tournament, match_num, result):
    t_id = tournament["_id"]

    pointsPerWin = 4 if tournament["format"] == "HUNDRED" else 2
    pointsPerNoResult = 2 if tournament["format"] == "HUNDRED" else 1

    if result not in ["Home-win", "Away-win", "No-result"]:
        abort(400, description=f"Invalid match result")

    match = get_match_with_toss_guard(t_id, match_num, "updating the match result")
    matchStage = stages_collection.find_one({"_id": ObjectId(match["stageId"])})

    if matchStage["type"] == "group":
        # Undo the previous result
        mode = "Undo"
        if match["result"] == "Home-win":
            update_team_match_win(match["homeStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["awayStageTeamId"], mode)
        elif match["result"] == "Away-win":
            update_team_match_win(match["awayStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["homeStageTeamId"], mode)
        elif match["result"] == "No-result":
            update_team_match_no_result(match["homeStageTeamId"], pointsPerNoResult, mode)
            update_team_match_no_result(match["awayStageTeamId"], pointsPerNoResult, mode)

        # Apply the new result
        mode = "Apply"
        if result == "Home-win":
            update_team_match_win(match["homeStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["awayStageTeamId"], mode)
        elif result == "Away-win":
            update_team_match_win(match["awayStageTeamId"], pointsPerWin, mode)
            update_team_match_loss(match["homeStageTeamId"], mode)
        elif result == "No-result":
            update_team_match_no_result(match["homeStageTeamId"], pointsPerNoResult, mode)
            update_team_match_no_result(match["awayStageTeamId"], pointsPerNoResult, mode)

        # NRR fields only apply when result isn't No-result. Undo/apply the contribution
        # whenever this change crosses the No-result boundary (except tied matches in HUNDRED format).
        format_type = tournament["format"]
        has_score = match["homeTeamBalls"] > 0 and match["awayTeamBalls"] > 0
        was_tie = has_score and (match["homeTeamRuns"] == match["awayTeamRuns"])

        was_active = match["result"] in ["Home-win", "Away-win"] or (format_type == "HUNDRED" and match["result"] == "No-result" and was_tie)
        will_be_active = result in ["Home-win", "Away-win"] or (format_type == "HUNDRED" and result == "No-result" and was_tie)

        if was_active and not will_be_active:
            apply_nrr_contribution(match, "Undo")
        elif not was_active and will_be_active:
            apply_nrr_contribution(match, "Apply")

    update_db_result = matches_collection.update_one(
        {"tournamentId": t_id, "matchNumber": match_num},
        {"$set": {"result": result}},
    )

    if update_db_result.matched_count == 0:
        raise ValueError("No match was found")

    propagate_match_simulation(t_id, matchStage)

# Methods: Clear matches
def clear_matches(tournament_id, mode, stage_order, match_nums):
    tournament = find_tournament(tournament_id)

    if tournament["name"] == "ICC World Test Championship":
        clear_wtc_matches(tournament, mode, stage_order, match_nums)
    else:
        clear_tournament_matches(tournament, mode, stage_order, match_nums)

def clear_wtc_matches(tournament, mode, stage_order, match_nums):
    t_id = tournament["_id"]
    filter_query = build_clear_filter(t_id, mode, stage_order, match_nums)
    matches = fetch_matches_with_stage_type(filter_query)

    team_acc = defaultdict(lambda: defaultdict(int))
    pointsPerWin, pointsPerTie, pointsPerDraw = 12, 6, 4

    for match in matches:
        if match["stageType"] != "group":
            continue
        home_id, away_id = match["homeStageTeamId"], match["awayStageTeamId"]
        result = match["result"]
        if result == "Home-win":
            team_acc[home_id]["won"] -= 1
            team_acc[home_id]["points"] -= pointsPerWin
            team_acc[home_id]["matchesPlayed"] -= 1
            team_acc[away_id]["lost"] -= 1
            team_acc[away_id]["matchesPlayed"] -= 1
        elif result == "Away-win":
            team_acc[away_id]["won"] -= 1
            team_acc[away_id]["points"] -= pointsPerWin
            team_acc[away_id]["matchesPlayed"] -= 1
            team_acc[home_id]["lost"] -= 1
            team_acc[home_id]["matchesPlayed"] -= 1
        elif result == "Draw":
            for tid in (home_id, away_id):
                team_acc[tid]["matchesPlayed"] -= 1
                team_acc[tid]["points"] -= pointsPerDraw
                team_acc[tid]["draw"] -= 1
        elif result == "Tie":
            for tid in (home_id, away_id):
                team_acc[tid]["matchesPlayed"] -= 1
                team_acc[tid]["points"] -= pointsPerTie
                team_acc[tid]["tied"] -= 1

    commit_and_propagate_match_clear(tournament, t_id, matches, team_acc)

def clear_tournament_matches(tournament, mode, stage_order, match_nums):
    t_id = tournament["_id"]
    filter_query = build_clear_filter(t_id, mode, stage_order, match_nums)
    matches = fetch_matches_with_stage_type(filter_query)

    team_acc = defaultdict(lambda: defaultdict(int))

    pointsPerWin = 4 if tournament["format"] == "HUNDRED" else 2
    pointsPerNoResult = 2 if tournament["format"] == "HUNDRED" else 1

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

        format_type = tournament["format"]
        is_tie = has_score and (match["homeTeamRuns"] == match["awayTeamRuns"])
        is_nrr_active = match["result"] != "No-result" or (format_type == "HUNDRED" and match["result"] == "No-result" and is_tie)

        if has_score and toss_known and is_nrr_active:
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
        
    commit_and_propagate_match_clear(tournament, t_id, matches, team_acc)

# Methods: Simulate matches
def simulate_matches(tournament_id, stage_num):
    tournament = find_tournament(tournament_id)

    if tournament["name"] == "ICC World Test Championship":
        simulate_wtc_matches(tournament, stage_num)
    else:
        simulate_tournament_matches(tournament, stage_num)

def simulate_wtc_matches(tournament, stage_num):
    t_id = tournament["_id"]

    pointsPerWin = 12 
    pointsPerTie = 6
    pointsPerDraw = 4

    stageToSim = stages_collection.find_one(
        {
            "tournamentId": t_id,
            "status": "active",
            "order": stage_num
        }
    )

    matches = list(matches_collection.find({
        "tournamentId": t_id,
        "status" : "incomplete",
        "stageId": ObjectId(stageToSim["_id"])
    }))

    team_updates = []
    match_updates = []

    for match in matches:
        result = random.choices(
                    ["Home-win", "Away-win", "Draw", "Tie"],
                    weights=[0.415, 0.315, 0.265, 0.005]
                )[0]

        if stageToSim["type"] == "group":
            home_id = ObjectId(match["homeStageTeamId"])
            away_id = ObjectId(match["awayStageTeamId"])
            old_result = match["result"]

            if old_result == "Home-win":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": -1, "won": -1, "points": -pointsPerWin}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": -1, "lost": -1}}))
            elif old_result == "Away-win":
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": -1, "won": -1, "points": -pointsPerWin}}))
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": -1, "lost": -1}}))
            elif old_result == "Draw":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": -1, "draw": -1, "points": -pointsPerDraw}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": -1, "draw": -1, "points": -pointsPerDraw}}))
            elif old_result == "Tie":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": -1, "tied": -1, "points": -pointsPerTie}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": -1, "tied": -1, "points": -pointsPerTie}}))


            if result == "Home-win":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": 1, "won": 1, "points": pointsPerWin}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": 1, "lost": 1}}))
            elif result == "Away-win":
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": 1, "won": 1, "points": pointsPerWin}}))
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": 1, "lost": 1}}))
            elif result == "Draw":
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": 1, "draw": 1, "points": pointsPerDraw}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": 1, "draw": 1, "points": pointsPerDraw}}))
            else:
                team_updates.append(UpdateOne({"_id": home_id}, {"$inc": {"matchesPlayed": 1, "tied": 1, "points": pointsPerTie}}))
                team_updates.append(UpdateOne({"_id": away_id}, {"$inc": {"matchesPlayed": 1, "tied": 1, "points": pointsPerTie}}))

        match_updates.append(UpdateOne({"_id": match["_id"]}, {"$set": {"result": result}}))

    if team_updates:
        stageTeams_collection.bulk_write(team_updates)

    if match_updates:
        matches_collection.bulk_write(match_updates)    

    propagate_match_simulation(t_id, stageToSim)

def simulate_tournament_matches(tournament, stage_num):
    t_id = tournament["_id"]

    pointsPerWin = 4 if tournament["format"] == "HUNDRED" else 2
    pointsPerNoResult = 2 if tournament["format"] == "HUNDRED" else 1

    stageToSim = stages_collection.find_one(
        {
            "tournamentId": t_id,
            "status": "active",
            "order": stage_num
        }
    )

    matches = list(matches_collection.find({
        "tournamentId": t_id,
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

    propagate_match_simulation(t_id, stageToSim)

################################################################################################################

def update_target_runs(id, match_num, target_runs):
    match = get_match_with_toss_guard(id, match_num, "updating the target")
    
    old_target = match["target"]
    
    # 1. Save the new target to MongoDB
    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"target": target_runs}}
    )

    tournament = tournaments_collection.find_one({"_id": id})
    format_type = tournament["format"] if tournament else None
    has_score = match["homeTeamBalls"] > 0 and match["awayTeamBalls"] > 0
    is_tie = has_score and (match["homeTeamRuns"] == match["awayTeamRuns"])
    is_nrr_active = match["result"] in ["Home-win", "Away-win"] or (format_type == "HUNDRED" and match["result"] == "No-result" and is_tie)

    if is_nrr_active:
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
    get_match_with_toss_guard(id, match_num, "updating the score")

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

    format_type = tournament["format"]

    old_has_score = old_match["homeTeamBalls"] > 0 and old_match["awayTeamBalls"] > 0
    old_is_tie = old_has_score and (old_match["homeTeamRuns"] == old_match["awayTeamRuns"])
    old_score_exists = (old_match["result"] != "No-result") or (format_type == "HUNDRED" and old_match["result"] == "No-result" and old_is_tie)

    new_has_score = new_home_balls > 0 and new_away_balls > 0
    new_is_tie = new_has_score and (int(home_runs) == int(away_runs))
    new_score_active = (old_match["result"] != "No-result") or (format_type == "HUNDRED" and old_match["result"] == "No-result" and new_is_tie)

    if old_score_exists or new_score_active:
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

        new_home_runs = 0 if not new_score_active else ((target - 1) if (target is not None and home_batted_first) else int(home_runs))
        new_away_runs = 0 if not new_score_active else ((target - 1) if (target is not None and not home_batted_first) else int(away_runs))

        new_hB = home_balls_nrr(home_wickets, new_home_balls) if new_score_active else 0
        new_aB = away_balls_nrr(away_wickets, new_away_balls) if new_score_active else 0

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
    get_match_with_toss_guard(id, match_num, "updating max balls")

    old_match = matches_collection.find_one_and_update(
        {"tournamentId": id, "matchNumber": int(match_num)},
        {"$set": {"{team}MaxBalls".format(team=team): max_balls}},
        return_document=False
    )

    if not old_match:
        raise ValueError("Match not found")

    tournament = tournaments_collection.find_one({"_id": id})
    format_type = tournament["format"] if tournament else None
    has_score = old_match["homeTeamBalls"] > 0 and old_match["awayTeamBalls"] > 0
    is_tie = has_score and (old_match["homeTeamRuns"] == old_match["awayTeamRuns"])
    is_nrr_active = old_match["result"] != "No-result" or (format_type == "HUNDRED" and old_match["result"] == "No-result" and is_tie)

    if is_nrr_active:
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

def abandon_match(id, match_num):
    clear_tournament_matches(id, "match-numbers", None, str(match_num))
    
    update_match_result(id, match_num, "No-result")

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
    match = get_match_with_toss_guard(id, match_num, "updating target overtaken status")

    if isinstance(target_overtaken, str):
        target_overtaken = target_overtaken.lower() == "true"

    matches_collection.update_one(
        {"_id": ObjectId(match["_id"])},
        {"$set": {"targetOvertaken": target_overtaken}}
    )

    return {"message": f"Match {match_num} for tournament {id} updated successfully"}
