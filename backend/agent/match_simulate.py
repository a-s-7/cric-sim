from utils import find_limited_overs_tournament
from services import match_service

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
            match_service.update_match_status(tournament_id, match_num, status)

            # Step 2
            match_service.abandon_match(tournament_id, match_num)
            return

        # Case B: Update completed match details

        tournament = find_limited_overs_tournament(tournament_id)

        # Step 1
        match_service.clear_tournament_matches(tournament, "match-numbers", None, str(match_num))

        # Step 2
        match_service.update_match_status_toss(tournament_id, match_num, status, toss_result, toss_decision)

        # Step 3
        match_service.update_tournament_match_result(tournament, match_num, result)

        # Step 4
        match_service.update_match_max_balls(tournament_id, match_num, 'home', match_result["homeMaxBalls"])
        match_service.update_match_max_balls(tournament_id, match_num, 'away', match_result["awayMaxBalls"])

        # Step 5
        if target is not None:
            match_service.update_match_target_runs(tournament_id, match_num, target)
            if target_overtaken:
                match_service.update_target_overtake_status(tournament_id, match_num, target_overtaken)

        # Step 6
        match_service.update_match_score(
            tournament_id, match_num,
            match_result['homeTeamRuns'], match_result['homeTeamWickets'], match_result["homeTeamBalls"],
            match_result['awayTeamRuns'], match_result['awayTeamWickets'], match_result["awayTeamBalls"]
        )

        return
    except Exception as e:
        raise RuntimeError(f"Match {match_num} simulation failed - {e}") from e

