from services import match_service

def update_match(context, match_result):
    """
    Updates a match by calling the shared match service directly:
      1. update_result        - (updates standings/points)
      2. update_match_status  - (updates match status)
      3. update_toss_result   - (updates toss result)
      4. update_toss_decision - (updates toss decision)
      5. update_max_balls     - (updates max balls)
      6. update_score         - (updates NRR)
    """
    tournament_id = context["tournament_id"]
    match_num = context["match_number"]
    result = match_result["result"]
    toss_result = match_result["tossResult"]
    toss_decision = match_result["tossDecision"]
    status = "complete"

    try:
        # Step 1: Update result
        match_service.update_result(tournament_id, match_num, result)

        # Step 2: Update match status
        match_service.update_match_status(tournament_id, match_num, status)

        # Step 3: Update toss result
        match_service.update_toss_result(tournament_id, match_num, toss_result)

        # Step 4: Update toss decision
        match_service.update_toss_decision(tournament_id, match_num, toss_decision)

        # Step 5: Update max balls
        match_service.update_max_balls(tournament_id, match_num, 'home', match_result["homeMaxBalls"])
        match_service.update_max_balls(tournament_id, match_num, 'away', match_result["awayMaxBalls"])

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
