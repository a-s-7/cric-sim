import json
import os
from pymongo import MongoClient
from pymongo.errors import BulkWriteError, DuplicateKeyError
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from bson import ObjectId

def main():
    if os.getenv("RENDER_STATUS") != "TRUE":
        from dotenv import load_dotenv
        load_dotenv()

    connection_string = os.getenv('MONGODB_URI')

    if not connection_string:
        raise ValueError("MONGODB_URI not found in environment variables")

    client = MongoClient(connection_string)
    db = client['events']

    ################################################################ (TOURNAMENTS COLLECTION)

    # Load tournament info as JSON

    event_folder = "t20-world-cup"
    file_name = "t20-wc-2026.json"

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "sources", "events", event_folder, file_name)

    with open(file_path, 'r') as file:
        json_info = json.load(file)


    # Prepare tournament data for DB

    tournament = json_info["tournament"]

    zone = ZoneInfo("America/Los_Angeles")

    tournament["startDate"] = datetime.fromisoformat(
        tournament["startDate"]
    ).replace(tzinfo=zone)

    tournament["endDate"] = datetime.fromisoformat(
        tournament["endDate"]
    ).replace(tzinfo=zone)

    # Add tournament to DB

    tournaments_collection = db['tournaments']

    try:
        result = tournaments_collection.insert_one(tournament)
        print("\nINSERTED TOURNAMENT WITH ID:", result.inserted_id)
        
    except DuplicateKeyError:
        print(f"Tournament with ID '{tournament['_id']}' already exists")

    ################################################################ (STAGES COLLECTION) 

    stages = json_info["stages"]

    stages_collection = db['stages']
    stages_collection.create_index(
        [("tournamentId", 1), ("order", 1)],
        unique=True
    )

    DB_STAGE_ORDER_TO_ID = {}

    try:
        result = stages_collection.insert_many(stages, ordered=True)
        print(f"\nINSERTED {len(result.inserted_ids)} STAGES\n")
        print(f"{'STAGE':<20} {'ID':<50}")
        print("─" * 70)

        for i, stage in enumerate(stages):
            stage_order = stage["order"]
            object_id = result.inserted_ids[i]
            DB_STAGE_ORDER_TO_ID[stage_order] = object_id
            print(f"{stage_order:<20} {str(object_id):<50}")
        print("─" * 70 + "\n")
                
    except BulkWriteError as e:
        write_errors = e.details.get('writeErrors', [])
        
        first_error_index = write_errors[0]['index']

        print(f"Error: Stopped inserting stage entries at stage order {first_error_index + 1}")


    ################################################################ (STAGE TEAMS COLLECTION) 

    stage_teams = json_info["stageTeams"]

    stage_teams_collection = db['stageTeams']
    stage_teams_collection.create_index(
        [("stageId", 1), ("teamId", 1)],
        unique=True,
        partialFilterExpression={"teamId": {"$type": "objectId"}}
    )

    for s_team in stage_teams:
        s_team["stageId"] = DB_STAGE_ORDER_TO_ID[s_team["stageOrder"]]
        del s_team["stageOrder"]


    DB_NAME_OR_SEED_TO_ID = {}

    try:
        result = stage_teams_collection.insert_many(stage_teams, ordered=True)
        print(f"INSERTED {len(result.inserted_ids)} STAGE TEAMS\n")
        print(f"{'STAGE TEAM':<20} {'ID':<50}")
        print("─" * 70)
        
        for i, s_team in enumerate(stage_teams):
            if "confirmed" in s_team and not s_team["confirmed"]:
                DB_NAME_OR_SEED_TO_ID[s_team["seed"]] = result.inserted_ids[i]
                print(f"{s_team['seed']:<20} {str(result.inserted_ids[i]):<50}")
            else:
                DB_NAME_OR_SEED_TO_ID[s_team["teamId"]] = result.inserted_ids[i]
                print(f"{s_team['teamId']:<20} {str(result.inserted_ids[i]):<50}")
        print("─" * 70 + "\n")
                        
    except BulkWriteError as e:
        write_errors = e.details.get('writeErrors', [])
        
        first_error_index = write_errors[0]['index']

        print(f"Error: Stopped inserting stage teams at stage team index {first_error_index}")

    ################################################################ (MATCHES COLLECTION)

    DB_STADIUM_NAME_TO_ID = {}

    venues_collection = db['venues']
    venues = venues_collection.find({
        "stadium": {
            "$in": json_info["stadiums"]
        }
    })
    venue_dict = {v["stadium"]: v["_id"] for v in venues}

    matches_collection = db['matches']

    matches_collection.create_index(
        [("tournamentId", 1), ("matchNumber", 1)],
        unique=True
    )

    matches = json_info["matches"]

    for match in matches:

        match["stageId"] = DB_STAGE_ORDER_TO_ID[match["stageOrder"]]
        del match["stageOrder"]    

        dt = datetime.fromisoformat(match["date"])
        dt_pst = dt.replace(tzinfo=zone)
        match["date"] = dt_pst.astimezone(timezone.utc)

        match["venueId"] = venue_dict[match["venue"]]
        del match["venue"]

        if match["homeStageTeamId"] is not None:
            match["homeStageTeamId"] = DB_NAME_OR_SEED_TO_ID[match["homeStageTeamId"]]
        if match["awayStageTeamId"] is not None:
            match["awayStageTeamId"] = DB_NAME_OR_SEED_TO_ID[match["awayStageTeamId"]]
        

    try:
        result = matches_collection.insert_many(matches, ordered=True)

        print(f"INSERTED {len(result.inserted_ids)} MATCHES\n")
        print(f"{'MATCH NUMBER':<20} {'ID':<50}")
        print("─" * 70)
        for i, id in enumerate(result.inserted_ids):
            print(f"{matches[i]['matchNumber']:<20} {str(id):<50}")
        print("─" * 70 + "\n")

    except BulkWriteError as e:
        write_errors = e.details.get('writeErrors', [])
        
        first_error_index = write_errors[0]['index']

        print(f"Error: Stopped inserting matches at match {first_error_index + 1}")

if __name__ == "__main__":
    main()


    

    



