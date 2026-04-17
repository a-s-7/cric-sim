from fetch import get_match_context
from search import get_match_result
from update import update_match

def run(match_id):
    """
    Runs the full agent pipeline for a single match:
      1. Fetch match context from the database
      2. Get the real-world result via AI + web search
      3. Update the match document via the backend API
    """

    # Step 1 — Fetch
    print(f"[1/3] Fetching match context for {match_id}...")
    context = get_match_context(match_id)
    print(f"       {context['home_team_name']} vs {context['away_team_name']} on {context['date']}")

    # Step 2 — AI
    print(f"[2/3] Searching for match result...")
    result = get_match_result(context)

    if "error" in result:
        print(f"[!] AI could not find a result: {result['error']}")
        return None

    print(f"       Result: {result['result']}")

    # Step 3 — Update
    print(f"[3/3] Updating match in database...")
    update_match(context, result)
    print(f"       ✓ Match #{context['match_number']} updated successfully.")

    return result

