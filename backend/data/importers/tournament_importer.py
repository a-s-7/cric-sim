import json
import os
from pymongo import MongoClient
from pymongo.errors import BulkWriteError, DuplicateKeyError
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from bson import ObjectId

def main(category, folder, file_name):
    # ANSI escape codes for colored terminal output
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    
    ######################################### Load tournament information from a JSON file
    if not folder or not file_name:
        raise ValueError("folder and file_name must be provided")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "sources", category, folder, file_name)

    with open(file_path, 'r') as file:
        json_info = json.load(file)

    ######################################### Load connection variables
    if os.getenv("RENDER_STATUS") != "TRUE":
        from dotenv import load_dotenv
        load_dotenv()

    connection_string = os.getenv('MONGODB_URI')

    if not connection_string:
        raise ValueError("MONGODB_URI not found in environment variables")

    client = MongoClient(connection_string)
    db = client['events']  

    tournament = json_info["tournament"]

    print(f"\n{CYAN}{BOLD}{'='*80}{ENDC}")
    print(f"{CYAN}{BOLD}TOURNAMENT IMPORT: {tournament.get('name', 'Unknown Tournament')} {tournament.get('edition', '')}{ENDC}")
    print(f"{CYAN}{BOLD}{'='*80}{ENDC}")

    ######################################### Validate teams and venues  

    print(f"\n{BLUE}{BOLD}STEP 1: DATA VALIDATION{ENDC}")
    print(f"{BLUE}{'─'*30}{ENDC}")

    # Check teams
    teams_in_file = tournament.get("teams", [])
    existing_teams = list(db['teams'].find({"_id": {"$in": teams_in_file}}))
    existing_team_ids = set(t["_id"] for t in existing_teams)
    missing_teams = [t for t in teams_in_file if t not in existing_team_ids]

    # Check stadiums
    stadiums_in_file = tournament.get("stadiums", [])
    existing_venues = list(db['venues'].find({"stadium": {"$in": stadiums_in_file}}))
    existing_stadium_names = set(v["stadium"] for v in existing_venues)
    missing_stadiums = [s for s in stadiums_in_file if s not in existing_stadium_names]

    if missing_teams or missing_stadiums:
        print(f"\n{RED}{BOLD}{'=' * 80}{ENDC}")
        print(f"{RED}{BOLD}VALIDATION ERROR: MISSING DATABASE RECORDS{ENDC}")
        print(f"{RED}{'─' * 80}{ENDC}")
        if missing_teams:
            print(f"{RED}{BOLD}MISSING TEAMS ({len(missing_teams)}):{ENDC}")
            for team in sorted(missing_teams):
                print(f"  {RED}- {team}{ENDC}")
            print(f"\n{BOLD}Please add these teams to the 'teams' collection (using these acronyms as '_id') before proceeding.{ENDC}")
        
        if missing_teams and missing_stadiums:
            print("\n")

        if missing_stadiums:
            print(f"{RED}{BOLD}MISSING STADIUMS ({len(missing_stadiums)}):{ENDC}")
            for stadium in sorted(missing_stadiums):
                print(f"  {RED}- {stadium}{ENDC}")
            print(f"\n{BOLD}Please add these stadiums to the 'venues' collection (matching the 'stadium' field) before proceeding.{ENDC}")
        
        print(f"{RED}{'─' * 80}{ENDC}")
        print(f"{RED}{BOLD}Import cancelled. Please insert the missing records and try again.{ENDC}")
        print(f"{RED}{BOLD}{'=' * 80}{ENDC}\n")
        return

    # If all present
    if not missing_teams:
        print(f"{GREEN}✓ All {len(teams_in_file)} teams present in the database.{ENDC}")
    if not missing_stadiums:
        print(f"{GREEN}✓ All {len(stadiums_in_file)} stadiums present in the database.{ENDC}")
    
    print(f"\n{BLUE}{BOLD}STEP 2: TOURNAMENT DATA IMPORT{ENDC}")
    print(f"{BLUE}{'─'*30}{ENDC}")

    ######################################### Insert tournament data
    # Prepare tournament data for DB

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
        print(f"{GREEN}{BOLD}✓ INSERTED TOURNAMENT WITH ID: {result.inserted_id}{ENDC}")
        
    except DuplicateKeyError:
        print(f"{RED}Tournament with ID '{tournament['_id']}' already exists{ENDC}")

    ######################################### Insert stages data

    stages = json_info["stages"]

    stages_collection = db['stages']
    
    stages_collection.create_index(
        [("tournamentId", 1), ("order", 1)],
        unique=True
    )

    DB_STAGE_ORDER_TO_ID = {}

    try:
        for stage in stages:
            stage["tournamentId"] = tournament["_id"]

        result = stages_collection.insert_many(stages, ordered=True)
        print(f"\n{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} STAGES{ENDC}\n")
        
        for i, stage in enumerate(stages):
            stage_order = stage["order"]
            object_id = result.inserted_ids[i]
            DB_STAGE_ORDER_TO_ID[stage_order] = object_id
            
    except (BulkWriteError, DuplicateKeyError):
        # If they already exist, we need to fetch their IDs to continue the script
        existing_stages = list(stages_collection.find({"tournamentId": tournament["_id"]}))
        print(f"\n{YELLOW}{BOLD}ℹ USING {len(existing_stages)} EXISTING STAGES{ENDC}\n")
        for stage in existing_stages:
            DB_STAGE_ORDER_TO_ID[stage["order"]] = stage["_id"]

    print(f"{BLUE}{BOLD}{'STAGE':<20} {'ID':<50}{ENDC}")
    print("─" * 70)
    for stage_order, object_id in sorted(DB_STAGE_ORDER_TO_ID.items()):
        print(f"{stage_order:<20} {str(object_id):<50}")
    print("─" * 70 + "\n")


    ######################################### Insert stage teams data

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
        s_team["tournamentId"] = tournament["_id"]
        s_team["runsScored"] = 0
        s_team["runsConceded"] = 0
        s_team["ballsFaced"] = 0
        s_team["ballsBowled"] = 0


    DB_NAME_OR_SEED_TO_ID = {}

    try:
        result = stage_teams_collection.insert_many(stage_teams, ordered=True)
        print(f"{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} STAGE TEAMS{ENDC}\n")
        print(f"{BLUE}{BOLD}{'STAGE TEAM':<20} {'ID':<50}{ENDC}")
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

        print(f"{RED}Error: Stopped inserting stage teams at stage team index {first_error_index}{ENDC}")

    ######################################### Insert matches data

    DB_STADIUM_NAME_TO_ID = {}

    venues_collection = db['venues']
    venues = venues_collection.find({
        "stadium": {
            "$in": tournament.get("stadiums", [])
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
        
        match["tossResult"] = "Home-win"
        match["tossDecision"] = "bat"
        match["homeTeamRuns"] = 0
        match["homeTeamWickets"] = 0
        match["homeTeamBalls"] = 0
        match["awayTeamRuns"] = 0
        match["awayTeamWickets"] = 0
        match["awayTeamBalls"] = 0
        match["tournamentId"] = tournament["_id"]

    try:
        result = matches_collection.insert_many(matches, ordered=True)

        print(f"{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} MATCHES{ENDC}\n")
        print(f"{BLUE}{BOLD}{'MATCH NUMBER':<20} {'ID':<50}{ENDC}")
        print("─" * 70)
        for i, id in enumerate(result.inserted_ids):
            print(f"{matches[i]['matchNumber']:<20} {str(id):<50}")
        print("─" * 70 + "\n")

    except BulkWriteError as e:
        write_errors = e.details.get('writeErrors', [])
        
        first_error_index = write_errors[0]['index']

        print(f"{RED}Error: Stopped inserting matches at match {first_error_index + 1}{ENDC}")

if __name__ == "__main__":
    main()


    

    



