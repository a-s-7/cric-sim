import os
from dotenv import load_dotenv

from pymongo import MongoClient

load_dotenv()

connection_string = os.getenv('MONGODB_URI')
client = MongoClient(connection_string)

db_name = "cricsim_prod" if os.getenv("ENVIRONMENT") == "production" else "cricsim_dev"
db = client[db_name]

matches_collection = db['matches']
series_collection = db['series']
stage_teams_collection = db['stageTeams']
stages_collection = db['stages']
teams_collection = db['teams']
tournaments_collection = db['tournaments']
venues_collection = db['venues']

