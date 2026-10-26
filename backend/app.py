import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from routes.match_service_routes import match_service_bp
from routes.match_sync_service_routes import match_sync_service_bp
from routes.tournament_service_routes import tournament_service_bp
from routes.venue_service_routes import venue_service_bp
from werkzeug.exceptions import HTTPException

app = Flask(__name__, static_folder='../frontend/build')

@app.errorhandler(HTTPException)
def handle_http_error(error):
    return jsonify({
        "status": error.code,
        "message": error.description
    }), error.code
    
CORS(app)

app.register_blueprint(match_service_bp)
app.register_blueprint(tournament_service_bp)
app.register_blueprint(match_sync_service_bp)
app.register_blueprint(venue_service_bp)

@app.route('/')
@app.route('/<path:path>')
def serve_react_app(path=''):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)