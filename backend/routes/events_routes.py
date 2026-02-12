import os
from datetime import datetime, timedelta
import random

from flask import Blueprint, jsonify
from pymongo import MongoClient, UpdateOne

if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')

# Connect with MongoDB
client = MongoClient(connection_string)
db = client['events']

tournaments_collection = db['tournaments']

events_bp = Blueprint('events_bp', __name__)

@events_bp.route('/tournaments', methods=['GET'])
def get_events_info():
    tournaments = {}

    for tournament in tournaments_collection.find():

        if tournament["format"] not in tournaments:
            tournaments[tournament["format"]] = []
        
        tournaments[tournament["format"]].append({"id": tournament["_id"],
                            "format": tournament["format"],
                            "name": tournament["name"],
                            "edition": tournament["edition"],
                            "status": tournament["status"],
                            "startDate": tournament["startDate"].isoformat(),
                            "endDate": tournament["endDate"].isoformat(),
                            "currentStageId": tournament["currentStageId"],
                            "gradient": tournament["gradient"],
                            "logo": tournament["logo"],
                            "pointsTableColor": tournament["pointsTableColor"]})
    
    return tournaments