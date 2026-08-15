import sys
import os

sys.path.append("backend")

from agent.match_sync import sync_match_result

tournament_id = "ipl-2026-rw"
match_number = 1

sync_match_result(tournament_id, match_number, verbose=True)