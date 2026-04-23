import sys
import os

# Fix paths simply
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipeline import run

tournament_id = "ipl-2026-rw"
match_number = 1

run(tournament_id, match_number)