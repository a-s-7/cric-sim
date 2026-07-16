import os
import sys
from pymongo import MongoClient
from bson import ObjectId

# Ensure we're running from the right directory context for .env
if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')
if not connection_string:
    print("Error: MONGODB_URI not found in environment variables.")
    sys.exit(1)

client = MongoClient(connection_string)
db = client['events']

# Helpful collection references
tournaments_collection = db['tournaments']
stageTeams_collection = db['stageTeams']
matches_collection = db['matches']
stages_collection = db["stages"]
teams_collection = db["teams"]
venues_collection = db["venues"]

print("Successfully connected to MongoDB!")
print("Available collections:", db.list_collection_names())
print("-" * 50)

# ==========================================
# Write your MongoDB queries below this line
# ==========================================

# Example:
# results = tournaments_collection.find_one()
# print(results)

result = tournaments_collection.update_many(
    {
        "edition": {"$type": "number"}
    },
    [
        {
            "$set": {
                "edition": {"$toString": "$edition"}
            }
        }
    ]
)
