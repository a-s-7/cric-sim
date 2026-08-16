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
series_collection = db["series"]
venues_collection = db["venues"]

def _lookup_by_id_field(id_field, from_collection, as_name):
    """Build a $lookup+$match stage that joins on a string field holding an ObjectId."""
    return {
        "$lookup": {
            "from": from_collection,
            "let": {"targetId": {"$toObjectId": f"${id_field}"}},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$_id", "$$targetId"]}}}
            ],
            "as": as_name,
        }
    }


def get_match_context(tournament_id, match_number):
    pipeline = [
        # 1. Find the match
        {"$match": {"tournamentId": tournament_id, "matchNumber": match_number}},

        # 2. Join tournament (string _id, no ObjectId conversion)
        {"$lookup": {
            "from": "tournaments",
            "localField": "tournamentId",
            "foreignField": "_id",
            "as": "tournament",
        }},
        {"$unwind": "$tournament"},

        # 3. Join venue, stage (ObjectId-backed)
        _lookup_by_id_field("venueId", "venues", "venue"),
        {"$unwind": "$venue"},

        _lookup_by_id_field("stageId", "stages", "stage"),
        {"$unwind": "$stage"},

        # 4. Join home team: match -> stageTeams (ObjectId) -> teams (string _id)
        _lookup_by_id_field("homeStageTeamId", "stageTeams", "homeStageTeam"),
        {"$unwind": "$homeStageTeam"},
        {"$lookup": {
            "from": "teams",
            "localField": "homeStageTeam.teamId",
            "foreignField": "_id",
            "as": "homeTeam",
        }},
        {"$unwind": "$homeTeam"},

        # 5. Join away team: match -> stageTeams (ObjectId) -> teams (string _id)
        _lookup_by_id_field("awayStageTeamId", "stageTeams", "awayStageTeam"),
        {"$unwind": "$awayStageTeam"},
        {"$lookup": {
            "from": "teams",
            "localField": "awayStageTeam.teamId",
            "foreignField": "_id",
            "as": "awayTeam",
        }},
        {"$unwind": "$awayTeam"},

        # 6. Join series (optional — only WTC matches have seriesId)
        _lookup_by_id_field("seriesId", "series", "series"),
        {"$unwind": {"path": "$series", "preserveNullAndEmptyArrays": True}},
    ]

    results = list(matches_collection.aggregate(pipeline))
    if not results:
        raise ValueError(f"Match not found: {tournament_id} - #{match_number}")

    return _build_context(results[0])

def _build_context(doc):
    tournament = doc["tournament"]

    context = {
        "tournament_name": tournament["name"],
        "tournament_edition": tournament["edition"],
        "format": tournament["format"],
        "date": doc["date"].strftime("%Y-%m-%d"),
        "home_team_name": doc["homeTeam"]["name"],
        "home_team_acronym": doc["homeTeam"]["acronym"],
        "away_team_name": doc["awayTeam"]["name"],
        "away_team_acronym": doc["awayTeam"]["acronym"],
        "stage": doc["stage"]["name"],
        "venue": doc["venue"]["stadium"],
        "city": doc["venue"]["city"],
        "country": doc["venue"]["country"],
    }

    if tournament["name"] == "ICC World Test Championship":
        context["series_name"] = doc["series"]["name"]
        context["series_match_number"] = doc["seriesMatchNumber"]

    return context