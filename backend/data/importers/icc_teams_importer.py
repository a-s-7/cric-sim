import json
import os
from pymongo import MongoClient
from pymongo.errors import BulkWriteError

########### ADD ICC TEAMS (TEAMS COLLECTION) ###########

def main():
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
    file_path = os.path.join(base_dir, "sources", "events", "icc-teams.json")

    with open(file_path, 'r') as file:
        json_info = json.load(file)

    try:
        result = teams_collection.insert_many(json_info["teams"], ordered=False)
        print(f"\nINSERTED {len(result.inserted_ids)} TEAMS\n")
        print(f"{'NAME':<40} {'ID':<10}")
        print("─" * 60)
        for i, id in enumerate(result.inserted_ids):
            name = json_info['teams'][i]['name']
            print(f"{name:<40} {str(id):<10}")
        print("─" * 60)
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

        print(f"\nINSERTED {len(inserted_acronyms)} TEAMS: {inserted_acronyms}")
        print(f"SKIPPED {len(failed_acronyms)} TEAMS: {failed_acronyms}\n")

if __name__ == "__main__":
    main()
