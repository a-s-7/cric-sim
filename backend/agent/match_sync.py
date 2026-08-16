import json
from agent.match_context import get_match_context
from agent.match_search import get_match_result

def sync_match_result(tournament_id, match_number, verbose=False):
    """
    Synchronizes a match result by:
      1. Fetching match context from the database
      2. Using the match context, finding the official result with an LLM and web search
      3. Using the match result, simulates the match
    """

    # Step 1: Fetch match context needed to search for the correct result
    if verbose:
        print(f"[1/3] Fetching match context for {tournament_id} - Match #{match_number}...")

    match_context = get_match_context(tournament_id, match_number)

    if verbose:
        print("=" * 30 + " Match Context " + "=" * 30)
        print(json.dumps(match_context, indent=2))

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
        print("[3/3] Simulating match with result...")

    from agent.match_simulate import simulate_match

    simulate_match(tournament_id, match_number, match_context["format"], match_result)

    if verbose:
        print(f"       ✓ Match #{match_number} updated successfully.")

    return match_result