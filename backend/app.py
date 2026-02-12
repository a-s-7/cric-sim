import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.wtc_routes import wtc_bp
from routes.franchise_league_routes import franchise_leagues_bp
from routes.events_routes import events_bp

app = Flask(__name__, static_folder='../frontend/build')
CORS(app)

app.register_blueprint(wtc_bp)
app.register_blueprint(franchise_leagues_bp)
app.register_blueprint(events_bp)

@app.route('/')
@app.route('/<path:path>')
def serve_react_app(path=''):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)