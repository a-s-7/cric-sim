from services import match_service

def update_match(context, match_result):
    """
    Updates a match by calling the shared match service directly.
    
    If no toss occurred, the match is abandoned:
        1. update_match_status          - Updates match status to complete.
        2. abandon_match                - Abandon match and set result to No-result.
      
    Otherwise, the match is updated with the following steps:
        1. clear_tournament_matches     - Clears match data, before update
        2. update_match_status_and_toss - Updates match status, toss result, and toss decision.
        3. update_result                - Updates match result.
        4. update_max_balls             - Updates max balls for both home and away teams.
        5. update_target_runs           - Updates DLS target runs if a target exists.
        6. update_score                 - Updates scores and net run rate (NRR).
    """
    tournament_id = context["tournament_id"]
    match_num = context["match_number"]
    result = match_result["result"]
    toss_result = match_result["tossResult"]
    toss_decision = match_result["tossDecision"]
    target = match_result["target"]
    status = "complete"

    try:        
        # Case A: Abandon match if no toss occurred, and return

        if toss_result == "None":
            # Step 1: Update match status to "complete"
            match_service.update_match_status(tournament_id, match_num, status)
            # Step 2: Abandon match (clears match, updates toss result and toss decision, updates result to "No-result")
            match_service.abandon_match(tournament_id, match_num)
            return {"status": "success", "message": f"Tournament {tournament_id} match #{match_num} abandoned"}

        # Case B: Update completed match details

        # Step 1: Clear all match data
        match_service.clear_tournament_matches(tournament_id, "match-numbers", None, str(match_num))

        # Step 2: Update match status, toss result, and toss decision together
        match_service.update_match_status_and_toss(tournament_id, match_num, status, toss_result, toss_decision)

        # Step 3: Update match result
        match_service.update_result(tournament_id, match_num, result)

        # Step 4: Update max balls
        match_service.update_max_balls(tournament_id, match_num, 'home', match_result["homeMaxBalls"])
        match_service.update_max_balls(tournament_id, match_num, 'away', match_result["awayMaxBalls"])

        # Step 5: Update target if it exists
        if target is not None:
            match_service.update_target_runs(tournament_id, match_num, target)

        # Step 6: Update score (handles NRR)
        match_service.update_score(
            tournament_id, match_num,
            match_result['homeTeamRuns'], match_result['homeTeamWickets'], match_result["homeTeamBalls"],
            match_result['awayTeamRuns'], match_result['awayTeamWickets'], match_result["awayTeamBalls"]
        )

        return {"status": "success", "message": f"Tournament {tournament_id} match #{match_num} updated"}
    except Exception as e:
        print(f"Error updating match {match_num}: {e}")
        raise

