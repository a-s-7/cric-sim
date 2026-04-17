import os
from flask import Blueprint, jsonify, request

import services.tournament_service as ts
import services.match_service as ms

events_bp = Blueprint('events_bp', __name__)

@events_bp.route('/tournaments', methods=['GET'])
def get_tournaments_info():
    group_results = request.args.get('grouped', 'true').lower() == 'true'
    category = request.args.get('category', 'franchise').lower()
    return ts.get_tournaments_info(group_results, category)


@events_bp.route('/tournaments/<string:id>/teams', methods=['GET'])
def get_tournaments_teams(id):
    try:
        return jsonify(ts.get_tournaments_teams(id))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@events_bp.route('/tournaments/<string:id>/venues', methods=['GET'])
def get_tournaments_venues(id):
    try:
        return jsonify(ts.get_tournaments_venues(id))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@events_bp.route('/tournaments/<string:id>/groups', methods=['GET'])
def get_tournaments_groups(id):
    try:
        return jsonify(ts.get_tournaments_groups(id))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@events_bp.route('/tournaments/<string:id>/stages', methods=['GET'])
def get_tournaments_stages(id):
    onlyActiveStages = request.args.get("onlyActiveStages", "")
    try:
        return jsonify(ts.get_tournaments_stages(id, onlyActiveStages))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@events_bp.route('/tournaments/<string:id>/standings', methods=['GET'])
def get_tournaments_standings(id):
    return jsonify(ts.get_tournaments_standings_data(id))


@events_bp.route('/tournaments/<string:id>/matches', methods=['GET'])
def get_tournaments_match_data(id):
    groups = request.args.get("groups", "")
    teams = request.args.get("teams", "")
    venues = request.args.get("venues", "")
    stages = request.args.get("stages", "")
    try:
        return jsonify(ts.get_tournaments_match_data(id, groups, teams, venues, stages))
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@events_bp.route('/tournaments/<string:id>/match/<int:match_num>/<string:result>', methods=['PATCH'])
def update_tournament_match_result(id, match_num, result):
    try:
        ms.update_result(id, match_num, result)
    except ValueError as e:
        return jsonify(str(e)), 404
    return jsonify({"message": f"Tournament id {id} match #{match_num} updated successfully"})


@events_bp.route('/tournaments/<string:id>/match/clear', methods=['PATCH'])
def clear_tournament_matches(id):
    mode = request.args.get("mode", "") 
    stage_order = request.args.get("stageOrder", type=int) 
    match_nums = request.args.get("match_nums", "") 

    try:
        res = ms.clear_tournament_matches(id, mode, stage_order, match_nums)
        return jsonify(res)
    except ValueError as e:
        if str(e) == "Tournament not found" or str(e) == "Stage not found":
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400


@events_bp.route('/tournaments/<string:id>/match/score/<int:match_num>/<int:home_runs>/<int:home_wickets>/<string:home_overs>/<int:away_runs>/<int:away_wickets>/<string:away_overs>', methods=['PATCH'])
def nrr_tournament_match(id, match_num, home_runs, home_wickets, home_overs, away_runs, away_wickets, away_overs):
    try:
        ms.update_score(id, match_num, home_runs, home_wickets, home_overs, away_runs, away_wickets, away_overs)
    except ValueError as e:
        return jsonify(str(e)), 404
    return jsonify({"message": f"Tournament id {id} match #{match_num} score updated successfully"})


@events_bp.route('/tournaments/<string:id>/match/simulate', methods=['PATCH'])
def simulate_tournament_matches(id):
    stage_num = request.args.get("stage_num", type=int)
    return jsonify(ms.simulate_tournament_matches(id, stage_num))


@events_bp.route('/tournaments/<string:id>/match/toss-result/<int:match_num>/<string:toss_result>', methods=['PATCH'])
def set_match_toss_result(id, match_num, toss_result):
    try:
        ms.update_toss_result(id, match_num, toss_result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify({"message": f"Match {match_num} for tournament {id} toss result set successfully"})


@events_bp.route('/tournaments/<string:id>/match/toss-decision/<int:match_num>/<string:toss_decision>', methods=['PATCH'])
def set_match_toss_decision(id, match_num, toss_decision):
    try:
        ms.update_toss_decision(id, match_num, toss_decision)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify({"message": f"Match {match_num} for tournament {id} toss decision set successfully"})