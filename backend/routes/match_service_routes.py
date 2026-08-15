from flask import Blueprint, jsonify, request
import services.tournament_service as ts
import services.match_service as ms

match_service_bp = Blueprint('match_service_bp', __name__)

#######################################################################################################################################
# Match Service Routes
#######################################################################################################################################

# Dual functionality routes

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/result/<string:result>', methods=['PATCH'])
def update_tournament_match_result(tournament_id, match_num, result):
    return jsonify(ms.update_match_result(tournament_id, match_num, result))

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/simulate', methods=['PATCH'])
def simulate_tournament_matches(tournament_id):
    stage_num = request.args.get("stage_num", type=int)
    return jsonify(ms.simulate_matches(tournament_id, stage_num))

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/clear', methods=['PATCH'])
def clear_tournament_matches(tournament_id):
    mode = request.args.get("mode", "") 
    stage_order = request.args.get("stageOrder", type=int) 
    match_nums = request.args.get("match_nums", "") 

    return jsonify(ms.clear_matches(tournament_id, mode, stage_order, match_nums))

# Unified functionality routes

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/toss-result/<string:toss_result>', methods=['PATCH'])
def set_match_toss_result(tournament_id, match_num, toss_result):
    return jsonify(ms.update_match_toss_result(tournament_id, match_num, toss_result))
   
@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/toss-decision/<string:toss_decision>', methods=['PATCH'])
def set_match_toss_decision(tournament_id, match_num, toss_decision):
    return jsonify(ms.update_match_toss_decision(tournament_id, match_num, toss_decision))

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/status/<string:status>', methods=['PATCH'])
def set_match_status(tournament_id, match_num, status):
    return jsonify(ms.update_match_status(tournament_id, match_num, status))
   
@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/abandon', methods=['PATCH'])
def abandon_match(tournament_id, match_num):
   return jsonify(ms.abandon_match(tournament_id, match_num))

#######################################################################################################################################

# Limited-overs routes 

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/score', methods=['PATCH'])
def update_match_score(tournament_id, match_num):
    home_runs = request.args.get("home_runs", type=int)
    home_wickets = request.args.get("home_wickets", type=int)
    home_balls = request.args.get("home_balls", type=int)
    away_runs = request.args.get("away_runs", type=int)
    away_wickets = request.args.get("away_wickets", type=int)
    away_balls = request.args.get("away_balls", type=int)

    return jsonify(ms.update_match_score(tournament_id, match_num, home_runs, home_wickets, home_balls, away_runs, away_wickets, away_balls))
   
@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/target', methods=['PATCH'])
@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/target/<int:target_runs>', methods=['PATCH'])
def update_match_target_runs(tournament_id, match_num, target_runs=None):
    return jsonify(ms.update_match_target_runs(tournament_id, match_num, target_runs))

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/target-overtaken/<string:target_overtaken>', methods=['PATCH'])
def update_match_target_overtake_status(tournament_id, match_num, target_overtaken):
    return jsonify(ms.update_target_overtake_status(tournament_id, match_num, target_overtaken))

@match_service_bp.route('/api/tournaments/<string:tournament_id>/matches/<int:match_num>/max-balls', methods=['PATCH'])
def update_match_max_balls(tournament_id, match_num):
    team = request.args.get("team", "")
    max_balls = request.args.get("max_balls", type=int)
    
    return jsonify(ms.update_match_max_balls(tournament_id, match_num, team, max_balls))
   
#######################################################################################################################################

# Methods: Only for WTC tournaments
@match_service_bp.route('/tournament/<string:tournament_id>/match/<int:match_num>/team/<string:team>/deduction/<int:deduction>', methods=['PATCH'])
def update_wtc_match_points_deduction(tournament_id, match_num, team, deduction):
    return jsonify(ms.update_wtc_match_points_deduction(tournament_id, match_num, team, deduction))

#######################################################################################################################################

@match_service_bp.route("/tournament/<tournament_id>/match/<int:match_num>/sync", methods=["PATCH"])
def force_sync_match(tournament_id, match_num):
    return jsonify(ms.force_sync_match(tournament_id, match_num))

@match_service_bp.route("/matches/auto-sync", methods=["POST"])
def auto_sync_matches():
    return jsonify(ms.auto_sync_matches())