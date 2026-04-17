import os
from pymongo import MongoClient
from bson import ObjectId

from dotenv import load_dotenv
load_dotenv()

connection_string = os.getenv('MONGODB_URI')

# Connect with MongoDB
client = MongoClient(connection_string)
db = client['events']

tournaments_collection = db['tournaments']
stageTeams_collection = db['stageTeams']
teams_collection = db['teams']
matches_collection = db['matches']
stages_collection = db["stages"]

def get_match_context(match_id):
    # Step 1: fetch the match
    match = matches_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise ValueError(f"Match not found: {match_id}")

    # Step 2: resolve home team
    home_stage_team = stageTeams_collection.find_one({"_id": ObjectId(match["homeStageTeamId"])})
    home_team = teams_collection.find_one({"_id": home_stage_team["teamId"]})

    # Step 3: resolve away team
    away_stage_team = stageTeams_collection.find_one({"_id": ObjectId(match["awayStageTeamId"])})
    away_team = teams_collection.find_one({"_id": away_stage_team["teamId"]})

    return {
        "match_id": str(match["_id"]),
        "match_number": match["matchNumber"],
        "date": match["date"].strftime("%Y-%m-%d"),
        "tournament_id": match["tournamentId"],
        "home_team_name": home_team["name"],
        "home_team_acronym": home_team["_id"],
        "away_team_name": away_team["name"],
        "away_team_acronym": away_team["_id"],
    }