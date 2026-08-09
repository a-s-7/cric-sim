from datetime import timedelta
import json
import os
from pymongo import MongoClient
from pymongo.errors import BulkWriteError, DuplicateKeyError
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from bson import ObjectId

def main(category, folder, file_name, auto_update=False, realWorld=False):
    # ANSI escape codes for colored terminal output
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    YELLOW = '\033[93m'
    
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
    team_ids_in_file = set(teams_in_file)

    existing_teams = list(db['teams'].find({"_id": {"$in": list(team_ids_in_file)}}))
    existing_team_ids = set(t["_id"] for t in existing_teams)

    missing_teams = team_ids_in_file - existing_team_ids

    # Check stadiums (dynamic check)
    matches = json_info["matches"]

    stadiums_in_file = set()
    for m in matches:
        stadiums_in_file.add(m['venue'])
    
    existing_venues = list(db['venues'].find({"stadium": {"$in": list(stadiums_in_file)}}))
    existing_stadiums = set(v["stadium"] for v in existing_venues)

    missing_stadiums = stadiums_in_file - existing_stadiums

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

    if realWorld:
        tournament["_id"] = tournament["_id"] + "-rw"
    else:
        tournament["_id"] = tournament["_id"] + "-ps"

    tournament["mode"] = "real-world" if realWorld else "pure-simulation"

    try:
        result = tournaments_collection.insert_one(tournament)
        print(f"{GREEN}{BOLD}✓ INSERTED TOURNAMENT WITH ID: {result.inserted_id}{ENDC}")
        
    except DuplicateKeyError:
        print(f"{RED}Tournament with ID '{tournament['_id']}' already exists{ENDC}")
        return

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
        if s_team["stageOrder"] == 1:
            s_team["matchesPlayed"] = 0
            s_team["won"] = 0
            s_team["lost"] = 0
            s_team["draw"] = 0
            s_team["tied"] = 0
            s_team["points"] = 0
            s_team["deductionPoints"] = 0

        s_team["stageId"] = DB_STAGE_ORDER_TO_ID[s_team["stageOrder"]]
        del s_team["stageOrder"]
        s_team["tournamentId"] = tournament["_id"]

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
                        
    except (BulkWriteError, DuplicateKeyError):
        existing_stage_teams = list(stage_teams_collection.find({"tournamentId": tournament["_id"]}))
        print(f"\n{YELLOW}{BOLD}ℹ USING {len(existing_stage_teams)} EXISTING STAGE TEAMS{ENDC}\n")
        for s_team in existing_stage_teams:
            if "confirmed" in s_team and not s_team["confirmed"]:
                DB_NAME_OR_SEED_TO_ID[s_team["seed"]] = s_team["_id"]
            else:
                DB_NAME_OR_SEED_TO_ID[s_team["teamId"]] = s_team["_id"]

    ######################################### Insert series data

    series_collection = db['series']

    series_collection.create_index(
        [("tournamentId", 1), ("seriesName", 1)],
        unique=True
    )

    series_data = json_info["series"]
    team_id_to_name = {t["_id"]: t["name"] for t in existing_teams}

    DB_SERIES_ID_TO_GUID = {}

    series_to_insert = []
    original_series_ids = []

    for s in series_data:
        orig_series_id = s["seriesId"]
        original_series_ids.append(orig_series_id)

        home_acronym = s["homeStageTeamId"]
        away_acronym = s["awayStageTeamId"]

        home_name = team_id_to_name[home_acronym]
        away_name = team_id_to_name[away_acronym]

        new_series = {
            "numMatches": s["numMatches"],
            "seriesName": f"{away_name} tour of {home_name}",
            "homeStageTeamId": DB_NAME_OR_SEED_TO_ID[home_acronym],
            "awayStageTeamId": DB_NAME_OR_SEED_TO_ID[away_acronym],
            "tournamentId": tournament["_id"]
        }
        series_to_insert.append(new_series)

    try:
        result = series_collection.insert_many(series_to_insert, ordered=True)
        print(f"{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} SERIES{ENDC}\n")
        print(f"{BLUE}{BOLD}{'SERIES NAME':<40} {'ID':<50}{ENDC}")
        print("─" * 70)

        for i, inserted_id in enumerate(result.inserted_ids):
            orig_id = original_series_ids[i]
            DB_SERIES_ID_TO_GUID[orig_id] = inserted_id
            print(f"{series_to_insert[i]['seriesName']:<40} {str(inserted_id):<50}")
        print("─" * 70 + "\n")

    except (BulkWriteError, DuplicateKeyError):
        existing_series = list(series_collection.find({"tournamentId": tournament["_id"]}))
        print(f"\n{YELLOW}{BOLD}ℹ USING {len(existing_series)} EXISTING SERIES{ENDC}\n")
        existing_by_name = {s["seriesName"]: s["_id"] for s in existing_series}
        for i, s in enumerate(series_to_insert):
            orig_id = original_series_ids[i]
            s_name = s["seriesName"]
            if s_name in existing_by_name:
                DB_SERIES_ID_TO_GUID[orig_id] = existing_by_name[s_name]

        print(f"{BLUE}{BOLD}{'SERIES NAME':<40} {'ID':<50}{ENDC}")
        print("─" * 70)
        for orig_id, inserted_id in DB_SERIES_ID_TO_GUID.items():
            s_name = next((s["seriesName"] for s in series_to_insert if s["seriesName"] in existing_by_name and existing_by_name[s["seriesName"]] == inserted_id), "Series")
            print(f"{s_name:<40} {str(inserted_id):<50}")
        print("─" * 70 + "\n")


    ######################################## Insert matches data

    venues_collection = db['venues']
    venues = venues_collection.find({
        "stadium": {
            "$in": list(stadiums_in_file)
        }
    })
    venue_dict = {v["stadium"]: v["_id"] for v in venues}

    matches_collection = db['matches']

    matches_collection.create_index(
        [("tournamentId", 1), ("matchNumber", 1)],
        unique=True,
        partialFilterExpression={"matchNumber": {"$exists": True}}
    )

    matches_collection.create_index(
        [("seriesId", 1), ("seriesMatchNumber", 1)],
        unique=True,
        partialFilterExpression={"seriesId": {"$type": "objectId"}}
    )

    matches = json_info["matches"]

    for match in matches:
        if match["stageOrder"] == 1:
            match["homeDeductionPoints"] = 0
            match["awayDeductionPoints"] = 0

        match["stageId"] = DB_STAGE_ORDER_TO_ID[match["stageOrder"]]
        del match["stageOrder"]   

        if "seriesId" in match and match["seriesId"] in DB_SERIES_ID_TO_GUID:
            match["seriesId"] = DB_SERIES_ID_TO_GUID[match["seriesId"]]

        start_dt = datetime.fromisoformat(match["date"])
        
        start_dt_pst = start_dt.replace(tzinfo=zone)
        end_dt_pst = start_dt_pst + timedelta(minutes=tournament["matchDurationMinutes"])

        match["date"] = start_dt_pst.astimezone(timezone.utc)
        match["endDate"] = end_dt_pst.astimezone(timezone.utc)

        match["venueId"] = venue_dict[match["venue"]]
        del match["venue"]

        if match["homeStageTeamId"] is not None:
            match["homeStageTeamId"] = DB_NAME_OR_SEED_TO_ID[match["homeStageTeamId"]]
        if match["awayStageTeamId"] is not None:
            match["awayStageTeamId"] = DB_NAME_OR_SEED_TO_ID[match["awayStageTeamId"]]
        
        match["tossResult"] = "Home-win"
        match["tossDecision"] = "bat"
        match["resultSummary"] = None
        match["autoUpdate"] = auto_update
        match["tournamentId"] = tournament["_id"]
        
    try:
        result = matches_collection.insert_many(matches, ordered=True)

        print(f"{GREEN}{BOLD}✓ INSERTED {len(result.inserted_ids)} MATCHES{ENDC}\n")
        print(f"{BLUE}{BOLD}{'SERIES MATCH NO':<20} {'ID':<50}{ENDC}")
        print("─" * 70)
        for i, id in enumerate(result.inserted_ids):
            m_num = matches[i].get('seriesMatchNumber', matches[i].get('description', f"Match {i+1}"))
            print(f"{str(m_num):<20} {str(id):<50}")
        print("─" * 70 + "\n")

    except (BulkWriteError, DuplicateKeyError):
        existing_matches = list(matches_collection.find({"tournamentId": tournament["_id"]}))
        print(f"\n{YELLOW}{BOLD}ℹ USING {len(existing_matches)} EXISTING MATCHES{ENDC}\n")

if __name__ == "__main__":
    # Example usage:
    # main("leagues", "ipl", "ipl-2026.json", auto_update=True, realWorld=True)
    pass

    

    



