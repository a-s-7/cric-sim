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

        failed_acronyms = []

        for err in write_errors:
            team = json_info["teams"][err['index']]
            failed_acronyms.append(team['acronym'])

        inserted_count = len(json_info["teams"]) - len(failed_acronyms)
        print(f"Inserted {inserted_count} teams")
        print("Skipped duplicates:", failed_acronyms)

if __name__ == "__main__":
    main()
