import services.venue_service as vs
from flask import Blueprint, jsonify, request

venue_service_bp = Blueprint('venue_service_bp', __name__)

#######################################################################################################################################
# Venue Service Routes
#######################################################################################################################################

@venue_service_bp.route('/api/venues', methods=['GET'])
def get_venues():
    return jsonify({"venues": vs.get_venues()})

@venue_service_bp.route('/api/venues/<string:venue_id>', methods=['PATCH'])
def update_venue(venue_id):
    return jsonify({"venue": vs.update_venue(venue_id, request.get_json(silent=True))})
