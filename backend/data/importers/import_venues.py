import json
import os
from pymongo import MongoClient
from pymongo.errors import BulkWriteError

def main():
    if os.getenv("RENDER_STATUS") != "TRUE":
        from dotenv import load_dotenv
        load_dotenv()

    connection_string = os.getenv('MONGODB_URI')

    if not connection_string:
        raise ValueError("MONGODB_URI not found in environment variables")

    client = MongoClient(connection_string)
    db = client['events']

    venues_collection = db['venues']
    venues_collection.create_index("stadium", unique=True)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "sources", "venues.json")

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
    print(f"{CYAN}{BOLD}VENUE IMPORT{ENDC}")
    print(f"{CYAN}{BOLD}{'='*80}{ENDC}")

    try:
        result = venues_collection.insert_many(json_info["venues"], ordered=False)
        print(f"\n{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} VENUES{ENDC}\n")
        print(f"{BLUE}{BOLD}{'STADIUM':<65} {'ID':<50}{ENDC}")
        print("─" * 115)
        for i, id in enumerate(result.inserted_ids):
            stadium = json_info['venues'][i]['stadium']
            print(f"{stadium:<65} {str(id):<50}")
        print("─" * 115 + "\n")
    except BulkWriteError as e:
        write_errors = e.details.get('writeErrors', [])
        failed_indices = {err['index'] for err in write_errors}
        failed_stadiums = []
        inserted_stadiums = []

        for i, venue in enumerate(json_info["venues"]):
            if i in failed_indices:
                failed_stadiums.append(venue['stadium'])
            else:
                inserted_stadiums.append(venue['stadium'])

        if inserted_stadiums:
            print(f"{GREEN}{BOLD}✓ INSERTED {len(inserted_stadiums)} VENUES:{ENDC}")
            for stadium in sorted(inserted_stadiums):
                print(f"  {GREEN}+ {stadium}{ENDC}")
        
        if failed_stadiums:
            print(f"{YELLOW}{BOLD}ℹ SKIPPED {len(failed_stadiums)} EXISTING VENUES:{ENDC}")
            for stadium in sorted(failed_stadiums):
                print(f"  {YELLOW}• {stadium}{ENDC}")
        print()

if __name__ == "__main__":
    main()