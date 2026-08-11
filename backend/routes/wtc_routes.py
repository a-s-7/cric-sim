import os
import random
from datetime import datetime

from flask import Blueprint, jsonify
from pymongo import MongoClient, UpdateOne

if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')

# Connect with MongoDB
client = MongoClient(connection_string)
db = client['test']

tournaments_collection = db['tournaments']
teams_collection = db['teams']
series_collection = db['series']
matches_collection = db['matches']

wtc_bp = Blueprint('wtc_bp', __name__)

@wtc_bp.route('/wtc/<edition>/points_table', methods=['GET'])
def get_wtc_points_table(edition):
    edition = int(edition)

    teams = list(teams_collection.find({"edition": edition}, {"_id": 0, "acronym": 0, "gradient": 0, "editionID": 0, "year": 0}))

    for team in teams:
        team["points"] = 0
        team["pointsPercentage"] = 0
        team["played"] = 0
        team["won"] = 0
        team["lost"] = 0
        team["draw"] = 0
        team["deduction"] = 0
        team["previous5"] = [None, None, None, None, None]

    team_dict = {}

    for team in teams:
        team_dict[team["name"]] = team


    matches = list(matches_collection.find({"edition": edition, "result": {"$ne": "None"}},
                                           {"_id": 0, "location": 0, "year": 0, "startDate": 0, "endDate": 0,
                                            "startTime":0, "seriesID": 0, "matchNumber":0}).sort({"startDate": 1}))

    for match in matches:
        awayTeamData = team_dict[match["awayTeam"]]
        homeTeamData = team_dict[match["homeTeam"]]

        awayTeamData["played"] += 1
        homeTeamData["played"] += 1

        if match["result"] == "Home-win":
            homeTeamData["won"] += 1
            homeTeamData["previous5"].pop()
            homeTeamData["previous5"].insert(0, "Win")
            homeTeamData["points"] += 12

            awayTeamData["lost"] += 1
            awayTeamData["previous5"].pop()
            awayTeamData["previous5"].insert(0, "Loss")
        elif match["result"] == "Away-win":
            awayTeamData["won"] += 1
            awayTeamData["previous5"].pop()
            awayTeamData["previous5"].insert(0, "Win")
            awayTeamData["points"] += 12

            homeTeamData["lost"] += 1
            homeTeamData["previous5"].pop()
            homeTeamData["previous5"].insert(0, "Loss")
        else:
            awayTeamData["draw"] += 1
            awayTeamData["points"] += 4
            awayTeamData["previous5"].pop()
            awayTeamData["previous5"].insert(0, "Draw")

            homeTeamData["draw"] += 1
            homeTeamData["points"] += 4
            homeTeamData["previous5"].pop()
            homeTeamData["previous5"].insert(0, "Draw")

        homeTeamData["deduction"] += match["homeDed"]
        awayTeamData["deduction"] += match["awayDed"]

    for team_key, team_data in team_dict.items():
        team_data["points"] -= team_data["deduction"]

        if team_data["played"] != 0:
            team_data["pointsPercentage"] = ((team_data["points"]) / (team_data["played"] * 12)) * 100

    points_table = sorted(list(team_dict.values()),
                          key=lambda t: (t["pointsPercentage"], t["played"]),
                          reverse=True)

    return points_table

@wtc_bp.route('/wtc/<edition>/sim/<series_match_pairs>', methods=['PATCH'])
def simulate_wtc_matches(edition, series_match_pairs):
    edition = int(edition)

    try:
        sm = series_match_pairs.split("-")

        results = ["Home-win", "Away-win", "Draw"]
        probabilities = [0.475, 0.475, 0.05]

        updates = []

        for ref in sm:
            s, m = ref.split(".")

            random_result = random.choices(results, weights=probabilities, k=1)[0]

            updates.append(UpdateOne(
                {"edition": edition, "seriesID": int(s), "matchNumber": int(m), "status": "incomplete"},
                {"$set": {"result": random_result}}
            ))


        result = matches_collection.bulk_write(updates)
        num_modified = result.modified_count
        num_matched = result.matched_count

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"message": f"{num_matched} matched - {num_modified} simulated"})

@wtc_bp.route('/wtc/<edition>/deduction/<series_id>/<match_num>/<team>/<deduction>', methods=['PATCH'])
def update_wtc_match_deduction(edition, series_id, match_num, team, deduction):
    edition = int(edition)

    try:
        field = "homeDed" if team == "home-team" else "awayDed"

        result = matches_collection.update_one(
            {"edition": edition, "seriesID": int(series_id), "matchNumber": int(match_num)},
            {"$set": {field: int(deduction)}}
        )

        if result.matched_count == 0:
            raise ValueError("No match was modified")

    except ValueError as e:
        return jsonify(str(e)), 404

    return jsonify({"message": f"WTC {edition} series {series_id} - match #{match_num} deduction updated successfully"})