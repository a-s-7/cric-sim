from flask import Blueprint, jsonify, request
import services.tournament_service as ts
import services.match_service as ms

tournament_service_bp = Blueprint('tournament_service_bp', __name__)

#######################################################################################################################################
# Tournament Service Routes
#######################################################################################################################################

@tournament_service_bp.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    group_results = request.args.get('grouped', 'false').lower() == 'true'
    category = request.args.get('category', 'all').lower()
    division = request.args.get('division', 'all').lower()

    return ts.get_tournaments(group_results, category, division)

@tournament_service_bp.route('/api/tournaments/<string:tournament_base_id>/info', methods=['GET'])
def get_tournament(tournament_base_id):
    return ts.get_tournament_info(tournament_base_id)

@tournament_service_bp.route('/api/tournaments/<string:tournament_id>/teams', methods=['GET'])
def get_tournament_teams(tournament_id):
   return jsonify(ts.get_tournament_teams(tournament_id))

@tournament_service_bp.route('/api/tournaments/<string:tournament_id>/venues', methods=['GET'])
def get_tournament_venues(tournament_id):
    return jsonify(ts.get_tournament_venues(tournament_id))

@tournament_service_bp.route('/api/tournaments/<string:tournament_id>/groups', methods=['GET'])
def get_tournament_groups(tournament_id):
    return jsonify(ts.get_tournament_groups(tournament_id))

@tournament_service_bp.route('/api/tournaments/<string:tournament_id>/stages', methods=['GET'])
def get_tournament_stages(tournament_id):
    onlyActiveStages = request.args.get("onlyActiveStages") == "true"
    
    return jsonify(ts.get_tournament_stages(tournament_id, onlyActiveStages))

@tournament_service_bp.route('/api/tournaments/<string:tournament_id>/matches', methods=['GET'])
def get_tournament_matches(tournament_id):
    groups = request.args.get("groups", "")
    teams = request.args.get("teams", "")
    venues = request.args.get("venues", "")
    stages = request.args.get("stages", "")

    return jsonify(ts.get_tournament_matches(tournament_id, groups, teams, venues, stages))

@tournament_service_bp.route('/api/tournaments/<string:tournament_id>/standings', methods=['GET'])
def get_tournament_standings(tournament_id):
    return jsonify(ts.get_tournament_standings(tournament_id))