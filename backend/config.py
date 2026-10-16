import os
from dotenv import load_dotenv

from pymongo import MongoClient

load_dotenv()

def get_db_name():
    return "cricsim_prod" if os.getenv("ENVIRONMENT") == "production" else "cricsim_dev"

connection_string = os.getenv('MONGODB_URI')

# Connect with MongoDB
client = MongoClient(connection_string)
db = client[get_db_name()]

matches_collection = db['matches']
series_collection = db['series']
stage_teams_collection = db['stageTeams']
stages_collection = db['stages']
teams_collection = db['teams']
tournaments_collection = db['tournaments']
venues_collection = db['venues']

