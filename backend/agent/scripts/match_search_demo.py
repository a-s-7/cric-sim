import sys
import time
import json

sys.path.append("backend")

from agent.match_context import get_match_context
from agent.match_search import get_match_result


tournament_id = "icc-mens-wtc-2025-27-rw"
match_number = 3


# Get match context
start = time.perf_counter()
########################################################
context = get_match_context(tournament_id, match_number)
########################################################
elapsed = time.perf_counter() - start

print("=" * 30 + " Match Context " + "=" * 30)
print(json.dumps(context, indent=2))
print(f"\nContext retrieval time: {elapsed:.2f} seconds")


# Get match result
start = time.perf_counter()
########################################################
result = get_match_result(context)
########################################################
elapsed = time.perf_counter() - start

print("\n" + "=" * 30 + " Match Result " + "=" * 30)
print(json.dumps(result, indent=2))
print(f"\nMatch result retrieval time: {elapsed:.2f} seconds")