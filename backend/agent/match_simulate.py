from utils import find_limited_overs_tournament, find_wtc_tournament
from services import match_service

def simulate_match(tournament_id, match_num, format, match_result):
    if format == "TEST":
        simulate_wtc_match(tournament_id, match_num, match_result)
    else: 
        simulate_limited_overs_match(tournament_id, match_num, match_result)

def simulate_wtc_match(tournament_id, match_num, match_result):
    """
    Updates a WTC match by calling the shared match service directly.

    The match result summary is updated first.

    If no toss occurred, the match is abandoned:
        1. update_match_status  - Marks the match as complete.
        2. abandon_match        - Abandons the match and sets the result to No-result.

    Otherwise, the completed match is updated:
        1. clear_tournament_matches          - Clears existing match data.
        2. update_match_status_toss          - Updates status and toss information.
        3. update_tournament_match_result    - Updates the official match result.
        4. update_wtc_match_points_deduction - Updates WTC points deductions.
    """

    try:
        result = match_result["result"]
        toss_result = match_result["tossResult"]
        toss_decision = match_result["tossDecision"]
        home_deduction_points = match_result["homeDeductionPoints"]
        away_deduction_points = match_result["awayDeductionPoints"]
        result_summary = match_result["resultSummary"]
        status = "complete"

        # Case A: Abandon match if no toss occurred
        if toss_result == "None":
            print("  [WTC] SUB-STAGE 1: Updating result summary")
            match_service.update_wtc_match_result_summary(tournament_id, match_num, result_summary)

            print("  [WTC] SUB-STAGE 2: Marking match complete")
            match_service.update_match_status(tournament_id, match_num, status)

            print("  [WTC] SUB-STAGE 3: Abandoning match")
            match_service.abandon_match(tournament_id, match_num)
            return

        # Case B: Update completed match
        print("  [WTC] SUB-STAGE 1: Finding tournament")
        tournament = find_wtc_tournament(tournament_id)

        print("  [WTC] SUB-STAGE 2: Clearing existing match data")
        match_service.clear_wtc_matches(tournament, "match-numbers", None, str(match_num))

        print("  [WTC] SUB-STAGE 3: Updating result summary")
        match_service.update_wtc_match_result_summary(tournament_id, match_num, result_summary)

        print("  [WTC] SUB-STAGE 4: Updating status and toss")
        match_service.update_match_status_toss(tournament_id, match_num, status, toss_result, toss_decision)

        print("  [WTC] SUB-STAGE 5: Updating match result")
        match_service.update_wtc_match_result(tournament, match_num, result)

        print("  [WTC] SUB-STAGE 6: Updating home deduction")
        match_service.update_wtc_match_points_deduction(tournament_id, match_num, "home", home_deduction_points)

        print("  [WTC] SUB-STAGE 7: Updating away deduction")
        match_service.update_wtc_match_points_deduction(tournament_id, match_num, "away", away_deduction_points)

        print("  ✓ SIMULATED: Match updated successfully")

    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        raise RuntimeError(e)

    
def simulate_limited_overs_match(tournament_id, match_num, match_result):
    """
    Updates a limited-overs match by calling the shared match service directly.
    
    If no toss occurred, the match is abandoned:
        1. update_match_status          - Updates match status to complete.
        2. abandon_match                - Abandon match and set result to No-result.
      
    Otherwise, the match is updated with the following steps:
        1. clear_tournament_matches     - Clears match data, before update
        2. update_match_status_toss - Updates match status, toss result, and toss decision.
        3. update_result                - Updates match result.
        4. update_max_balls             - Updates max balls for both home and away teams.
        5. update_target_runs           - Updates DLS target runs if a target exists.
        6. update_score                 - Updates scores and net run rate (NRR).
    """

    try:
        result = match_result["result"]
        toss_result = match_result["tossResult"]
        toss_decision = match_result["tossDecision"]
        target = match_result["target"]
        target_overtaken = match_result["targetOvertaken"]

        if isinstance(target_overtaken, str):
            target_overtaken = target_overtaken.lower() == "true"
        status = "complete"

        # Case A: Abandon match if no toss occurred, and return
        if toss_result == "None":
            # Step 1
            print("  [LO] SUB-STAGE 1: Marking match complete")
            match_service.update_match_status(tournament_id, match_num, status)

            # Step 2
            print("  [LO] SUB-STAGE 2: Abandoning match")
            match_service.abandon_match(tournament_id, match_num)
            return

        # Case B: Update completed match details

        tournament = find_limited_overs_tournament(tournament_id)

        # Step 1
        print("  [LO] SUB-STAGE 1: Clearing existing match data")
        match_service.clear_tournament_matches(tournament, "match-numbers", None, str(match_num))

        # Step 2
        print("  [LO] SUB-STAGE 2: Updating status and toss")
        match_service.update_match_status_toss(tournament_id, match_num, status, toss_result, toss_decision)

        # Step 3
        print("  [LO] SUB-STAGE 3: Updating match result")
        match_service.update_tournament_match_result(tournament, match_num, result)

        # Step 4
        print("  [LO] SUB-STAGE 4: Updating max balls")
        match_service.update_match_max_balls(tournament_id, match_num, 'home', match_result["homeMaxBalls"])
        match_service.update_match_max_balls(tournament_id, match_num, 'away', match_result["awayMaxBalls"])

        # Step 5
        if target is not None:
            print("  [LO] SUB-STAGE 5: Updating DLS target")
            match_service.update_match_target_runs(tournament_id, match_num, target)
            if target_overtaken:
                match_service.update_target_overtake_status(tournament_id, match_num, target_overtaken)

        # Step 6
        print("  [LO] SUB-STAGE 6: Updating score and NRR")
        match_service.update_match_score(
            tournament_id, match_num,
            match_result['homeTeamRuns'], match_result['homeTeamWickets'], match_result["homeTeamBalls"],
            match_result['awayTeamRuns'], match_result['awayTeamWickets'], match_result["awayTeamBalls"]
        )

        print("  [LO] Match updated successfully")
        return
    except Exception as e:
        print(f"  [LO] FAILED at stage: {e}")
        raise RuntimeError(f"Match {match_num} simulation failed - {e}") from e

