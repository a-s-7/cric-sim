from flask import Blueprint, jsonify
import services.match_sync_service as sync_service

match_sync_service_bp = Blueprint('match_sync_service_bp', __name__)

@match_sync_service_bp.route("/api/tournaments/<string:tournament_id>/matches/<int:match_num>/sync", methods=["PATCH"])
def force_sync_match(tournament_id, match_num):
    res, status_code = sync_service.force_sync_match(tournament_id, match_num)
    return jsonify(res), status_code


@match_sync_service_bp.route("/api/matches/auto-sync", methods=["POST"])
def auto_sync_matches():
    return jsonify(sync_service.auto_sync_matches())
