import sys
import time

sys.path.append("backend")

from agent.match_context import get_match_context
import json

tournament_id = "icc-mens-wtc-2025-27-rw"
match_number = 5

start = time.perf_counter()
########################################################
context = get_match_context(tournament_id, match_number)
########################################################
elapsed = time.perf_counter() - start

print("=" * 30 + " Match Context " + "=" * 30)
print(json.dumps(context, indent=2))
print(f"\nContext retrieval time: {elapsed * 1000:.2f} ms")