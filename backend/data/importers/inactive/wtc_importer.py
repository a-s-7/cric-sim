import json
import os
from datetime import datetime

from pymongo import MongoClient

year = "2025"

if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')

client = MongoClient(connection_string)
db = client['test']

data = "wtc" + "-" + year + '.json'
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(base_dir, "sources", "events", "world-test-championship", data)

with open(file_path, 'r') as file:
    json_info = json.load(file)

########### ADD TOURNAMENT (TOURNAMENT COLLECTION) ###########

tournaments_collection = db['tournaments']

fields_omitted = ["teams", "series"]

tournament_collection = {}

for key in json_info:
    if key not in fields_omitted:
        tournament_collection[key] = json_info[key]

result = tournaments_collection.insert_one(tournament_collection)

print(f"ID: {result.inserted_id}")

########### ADD TEAM DOCUMENTS (TEAMS COLLECTION) ###########

teams_collection = db['teams']

teams = json_info["teams"]

for team in teams:
     team["edition"] = json_info["edition"]

result = teams_collection.insert_many(teams)

print(f"# Teams Inserted: {len(result.inserted_ids)}")

########### ADD SERIES AND MATCHES DOCUMENTS (SERIES & MATCHES COLLECTION) ###########

series_collection = db['series']
matches_collection = db['matches']

series_data = json_info["series"]

series = []
matches = []

for seriesObj in series_data:
    newSeries = {}

    for key in seriesObj:
        if key != "matches":
            newSeries[key] = seriesObj[key]

    newSeries["edition"] = json_info["edition"]

    series.append(newSeries)

    ms = seriesObj["matches"]

    for index, m in enumerate(ms):
        sd = m["startDate"].split("-")
        ed = m["endDate"].split("-")
        m["startDate"] = datetime(int(sd[0]), int(sd[1]), int(sd[2]))
        m["endDate"] = datetime(int(ed[0]), int(ed[1]), int(ed[2]))
        m["seriesID"] = newSeries["seriesId"]
        m["matchNumber"] = index + 1
        m["homeTeam"] = newSeries["homeTeam"]
        m["awayTeam"] = newSeries["awayTeam"]
        m["edition"] = json_info["edition"]
        matches.append(m)


resSeries = series_collection.insert_many(series)
resMatches = matches_collection.insert_many(matches)

print(f"# Series Inserted: {len(resSeries.inserted_ids)}")
print(f"# Matches Inserted: {len(resMatches.inserted_ids)}")

client.close()