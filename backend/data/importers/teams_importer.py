import json
import os
import sys
from pymongo import MongoClient
from pymongo.errors import BulkWriteError

########### ADD TEAMS (TEAMS COLLECTION) ###########

def main(team_type):
    if os.getenv("RENDER_STATUS") != "TRUE":
        from dotenv import load_dotenv
        load_dotenv()

    connection_string = os.getenv('MONGODB_URI')

    if not connection_string:
        raise ValueError("MONGODB_URI not found in environment variables")

    client = MongoClient(connection_string)
    db = client['events']

    teams_collection = db['teams']

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    file = team_type + "-teams.json"
    file_path = os.path.join(base_dir, "sources", "teams", file)

    with open(file_path, 'r') as file:
        json_info = json.load(file)

    # ANSI escape codes for colored terminal output
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'

    print(f"\n{CYAN}{BOLD}{'='*80}{ENDC}")
    print(f"{CYAN}{BOLD}{team_type.upper()} TEAM IMPORT{ENDC}")
    print(f"{CYAN}{BOLD}{'='*80}{ENDC}")

    try:
        result = teams_collection.insert_many(json_info["teams"], ordered=False)
        print(f"\n{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} {team_type.upper()} TEAMS{ENDC}\n")
        print(f"{BLUE}{BOLD}{'NAME':<40} {'ID':<10}{ENDC}")
        print("─" * 60)
        for i, id in enumerate(result.inserted_ids):
            name = json_info['teams'][i]['name']
            print(f"{name:<40} {str(id):<10}")
        print("─" * 60 + "\n")
    except BulkWriteError as e:
        write_errors = e.details.get('writeErrors', [])

        failed_indices = {err['index'] for err in write_errors}
        failed_acronyms = []
        inserted_acronyms = []

        for i, team in enumerate(json_info["teams"]):
            if i in failed_indices:
                failed_acronyms.append(team['_id'])
            else:
                inserted_acronyms.append(team['_id'])

        if inserted_acronyms:
            print(f"{GREEN}{BOLD}✓ INSERTED {len(inserted_acronyms)} {team_type.upper()} TEAMS:{ENDC}")
            for acronym in sorted(inserted_acronyms):
                print(f"  {GREEN}+ {acronym}{ENDC}")
        
        if failed_acronyms:
            print(f"{YELLOW}{BOLD}ℹ SKIPPED {len(failed_acronyms)} EXISTING {team_type.upper()} TEAMS:{ENDC}")
            for acronym in sorted(failed_acronyms):
                print(f"  {YELLOW}• {acronym}{ENDC}")
        print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise ValueError("Usage: python script.py <team_type> (franchise | national)")

    team_type = sys.argv[1].lower()

    if team_type not in ["franchise", "national"]:
        raise ValueError("team_type must be 'franchise' or 'national'")

    main(team_type)
