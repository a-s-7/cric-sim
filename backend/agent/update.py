def balls_to_overs(balls):
    """Convert balls (e.g. 111) to overs string (e.g. '18.3')."""
    full_overs = balls // 6
    remaining = balls % 6
    if remaining == 0:
        return str(full_overs)
    return f"{full_overs}.{remaining}"


def update_match(context, match_result):
    """
    Updates a match by calling the shared matching service directly:
      1. update_result (updates standings/points)
      2. update_toss_result
      3. update_toss_decision
      4. update_score (updates NRR)
    """
    import services.match_service as match_service

    tournament_id = context["tournament_id"]
    match_num = context["match_number"]
    result = match_result["result"]
    toss_result = match_result["tossResult"]
    toss_decision = match_result["tossDecision"]

    try:
        # Step 1: Update result
        match_service.update_result(tournament_id, match_num, result)

        # Step 2: Update toss result
        match_service.update_toss_result(tournament_id, match_num, toss_result)

        # Step 3: Update toss decision
        match_service.update_toss_decision(tournament_id, match_num, toss_decision)

        # Step 4: Update score (handles NRR)
        home_overs = balls_to_overs(match_result["homeTeamBalls"])
        away_overs = balls_to_overs(match_result["awayTeamBalls"])

        match_service.update_score(
            tournament_id, match_num,
            match_result['homeTeamRuns'], match_result['homeTeamWickets'], home_overs,
            match_result['awayTeamRuns'], match_result['awayTeamWickets'], away_overs
        )

        return {"status": "success", "message": f"Tournament {tournament_id} match #{match_num} updated"}
    except Exception as e:
        print(f"Error updating match {match_num}: {e}")
        raise
