from flask import Blueprint, jsonify, request
import services.tournament_service as ts
import services.match_service as ms
from utils import is_gemini_quota_error


events_bp = Blueprint('events_bp', __name__)

#######################################################################################################################################
# Tournament Service Routes
#######################################################################################################################################

@events_bp.route('/tournaments', methods=['GET'])
def get_tournaments():
    group_results = request.args.get('grouped', 'false').lower() == 'true'
    category = request.args.get('category', 'all').lower()
    division = request.args.get('division', 'all').lower()

    return ts.get_tournaments_info(group_results, category, division)

@events_bp.route('/tournament/<string:tournament_id>/teams', methods=['GET'])
def get_tournament_teams(tournament_id):
   return jsonify(ts.get_tournament_teams(tournament_id))

@events_bp.route('/tournament/<string:tournament_id>/venues', methods=['GET'])
def get_tournament_venues(tournament_id):
    return jsonify(ts.get_tournament_venues(tournament_id))

@events_bp.route('/tournament/<string:tournament_id>/groups', methods=['GET'])
def get_tournament_groups(tournament_id):
    return jsonify(ts.get_tournament_groups(tournament_id))

@events_bp.route('/tournament/<string:tournament_id>/stages', methods=['GET'])
def get_tournament_stages(tournament_id):
    onlyActiveStages = request.args.get("onlyActiveStages") == "true"
    
    return jsonify(ts.get_tournament_stages(tournament_id, onlyActiveStages))

@events_bp.route('/tournament/<string:tournament_id>/matches', methods=['GET'])
def get_tournament_matches(tournament_id):
    groups = request.args.get("groups", "")
    teams = request.args.get("teams", "")
    venues = request.args.get("venues", "")
    stages = request.args.get("stages", "")

    return jsonify(ts.get_tournament_matches(tournament_id, groups, teams, venues, stages))

@events_bp.route('/tournament/<string:tournament_id>/standings', methods=['GET'])
def get_tournament_standings(tournament_id):
    return jsonify(ts.get_tournament_standings(tournament_id))

#######################################################################################################################################
# Match Service Routes
#######################################################################################################################################

# Dual functionality routes

@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/<string:result>', methods=['PATCH'])
def update_tournament_match_result(tournament_id, match_num, result):
    return jsonify(ms.update_match_result(tournament_id, match_num, result))

@events_bp.route('/tournament/<string:tournament_id>/match/simulate', methods=['PATCH'])
def simulate_tournament_matches(tournament_id):
    stage_num = request.args.get("stage_num", type=int)
    return jsonify(ms.simulate_matches(tournament_id, stage_num))

@events_bp.route('/tournament/<string:tournament_id>/match/clear', methods=['PATCH'])
def clear_tournament_matches(tournament_id):
    mode = request.args.get("mode", "") 
    stage_order = request.args.get("stageOrder", type=int) 
    match_nums = request.args.get("match_nums", "") 

    return jsonify(ms.clear_matches(tournament_id, mode, stage_order, match_nums))

#######################################################################################################################################

# Unified functionality routes

@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/toss-result/<string:toss_result>', methods=['PATCH'])
def set_match_toss_result(tournament_id, match_num, toss_result):
    return jsonify(ms.update_match_toss_result(tournament_id, match_num, toss_result))
   
@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/toss-decision/<string:toss_decision>', methods=['PATCH'])
def set_match_toss_decision(tournament_id, match_num, toss_decision):
    return jsonify(ms.update_match_toss_decision(tournament_id, match_num, toss_decision))

@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/status/<string:status>', methods=['PATCH'])
def set_match_status(tournament_id, match_num, status):
    return jsonify(ms.update_match_status(tournament_id, match_num, status))
   
@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/abandon', methods=['PATCH'])
def abandon_match(tournament_id, match_num):
   return jsonify(ms.abandon_match(tournament_id, match_num))

#######################################################################################################################################

# Methods: Only for limited-overs tournaments
@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/score', methods=['PATCH'])
def update_match_score(tournament_id, match_num):
    home_runs = request.args.get("home_runs", type=int)
    home_wickets = request.args.get("home_wickets", type=int)
    home_balls = request.args.get("home_balls", type=int)
    away_runs = request.args.get("away_runs", type=int)
    away_wickets = request.args.get("away_wickets", type=int)
    away_balls = request.args.get("away_balls", type=int)

    return jsonify(ms.update_match_score(tournament_id, match_num, home_runs, home_wickets, home_balls, away_runs, away_wickets, away_balls))
   
@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/target', methods=['PATCH'])
@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/target/<int:target_runs>', methods=['PATCH'])
def update_match_target_runs(tournament_id, match_num, target_runs=None):
    return jsonify(ms.update_match_target_runs(tournament_id, match_num, target_runs))

@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/target-overtaken/<string:target_overtaken>', methods=['PATCH'])
def update_match_target_overtake_status(tournament_id, match_num, target_overtaken):
    return jsonify(ms.update_target_overtake_status(tournament_id, match_num, target_overtaken))

@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/max-balls', methods=['PATCH'])
def update_match_max_balls(tournament_id, match_num):
    team = request.args.get("team", "")
    max_balls = request.args.get("max_balls", type=int)
    
    return jsonify(ms.update_match_max_balls(tournament_id, match_num, team, max_balls))
   
#######################################################################################################################################

# Methods: Only for WTC tournaments
@events_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/team/<string:team>/deduction/<int:deduction>', methods=['PATCH'])
def update_wtc_match_points_deduction(tournament_id, match_num, team, deduction):
    return jsonify(ms.update_wtc_match_points_deduction(tournament_id, match_num, team, deduction))

#######################################################################################################################################

@events_bp.route("/tournament/<tournament_id>/match/<int:match_num>/sync", methods=["PATCH"])
def force_sync_match(tournament_id, match_num):
    return jsonify(ms.force_sync_match(tournament_id, match_num))

@events_bp.route("/matches/auto-sync", methods=["POST"])
def auto_sync_matches():
    return jsonify(ms.auto_sync_matches())