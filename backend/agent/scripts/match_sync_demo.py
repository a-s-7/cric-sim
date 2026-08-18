import sys
import os
import json

sys.path.append("backend")

from agent.match_sync import sync_match_result

tournament_id = "icc-mens-wtc-2025-27-rw"
match_number = 14
verbose = True

script_dir = os.path.dirname(os.path.abspath(__file__))
sample_data_path = os.path.join(script_dir, "sample_data.json")

with open(sample_data_path) as f:
    sample_data = json.load(f)

sr = sample_data["wtc_result"]

metrics = sync_match_result(
    tournament_id,
    match_number,
    sample_result=sr,
    verbose=True
)
print('\n' + "*" * 50 + "SYNC METRICS" + "*" * 50)
print(json.dumps(metrics, indent=2))