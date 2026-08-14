from agent.match_context import get_match_context
from agent.match_search import get_match_result
from agent.match_simulate import simulate_limited_overs_match

def sync_match_result(tournament_id, match_number, verbose=False):
    """
    Synchronizes a match result by:
      1. Fetching match context from the database
      2. Using the match context, finding the official result with an LLM and web search
      3. Using the match context and result, simulates the match
    """

    # Step 1: Load match context needed to search for the correct result and simulate the match
    if verbose:
        print(f"[1/3] Fetching match context for {tournament_id} - Match #{match_number}...")

    match_context = get_match_context(tournament_id, match_number)

    if verbose:
        print(f"       {match_context['home_team_name']} vs {match_context['away_team_name']} on {match_context['date']}")

    # Step 2: Resolve the official result using an LLM + web search, grounded in the match context, and check for failure
    if verbose:
        print("[2/3] Searching for match result...")

    match_result = get_match_result(match_context)

    if "error" in match_result:
        if verbose:
            print(f"[!] AI could not find a result: {match_result['error']}")
        raise Exception(match_result["error"])

    if verbose:
        print(f"       Result: {match_result}")

    # Step 3: Write the resolved result back to the match document.
    if verbose:
        print("[3/3] Updating match in database...")

    simulate_limited_overs_match(match_context, match_result)

    if verbose:
        print(f"       ✓ Match #{match_context['match_number']} updated successfully.")

    return match_result