import os
from datetime import datetime, timezone
from pymongo import MongoClient
from flask import abort

try:
    from utils import is_gemini_quota_error, format_auto_sync_log
    from services.notification_service import send_notification
except ImportError:
    from backend.utils import is_gemini_quota_error, format_auto_sync_log
    from backend.services.notification_service import send_notification

from agent.match_sync import sync_match_result

if os.getenv("RENDER_STATUS") != "TRUE":
    from dotenv import load_dotenv
    load_dotenv()

connection_string = os.getenv('MONGODB_URI')
client = MongoClient(connection_string)
db = client['events']

tournaments_collection = db['tournaments']
matches_collection = db['matches']


def force_sync_match(tournament_id, match_num):
    """
    Forces synchronization of a single real-world match by tournament ID and match number.
    """
    tournament = tournaments_collection.find_one({"_id": tournament_id})

    if not tournament or tournament["mode"] != "real-world":
        abort(400, description="Match synchronization is only supported for real-world tournaments")

    match = matches_collection.find_one({
        "tournamentId": tournament_id,
        "matchNumber": int(match_num)
    })

    if not match:
        abort(404, description="Match not found")

    res = sync_match_result(match["tournamentId"], match["matchNumber"], verbose=True)

    status_code = 200
    if res.get("status") == "failed":
        status_code = 429 if res.get("is_quota_error") else 500

    return res, status_code

def auto_sync_matches():
    """
    Automatically syncs incomplete real-world matches whose end date has passed.
    Returns structured execution response and status.
    """
    rw_tournaments = tournaments_collection.find({"mode": "real-world"})
    rw_tournament_ids = [t["_id"] for t in rw_tournaments]

    matches = list(matches_collection.find({
        "tournamentId": {"$in": rw_tournament_ids},
        "endDate": {"$lt": datetime.now(timezone.utc)},
        "autoUpdate": True,
        "status": "incomplete"
    }).sort("endDate", 1))

    synced_matches = []
    quota_exhausted = False

    for match in matches:
        res = sync_match_result(match["tournamentId"], match["matchNumber"], verbose=False)
        synced_matches.append(res)

        if res.get("status") == "failed" and res.get("is_quota_error"):
            quota_exhausted = True
            break

    updated_count = sum(
        1 for m in synced_matches if m["status"] == "success"
    )
    failed_count = sum(
        1 for m in synced_matches if m["status"] == "failed"
    )
    skipped_count = len(matches) - len(synced_matches)

    all_matches = list(synced_matches)
    for m in matches[len(synced_matches):]:
        t_id = m.get("tournamentId")
        m_num = m.get("matchNumber")
        home = m.get("homeTeam") or m.get("home_team_name") or m.get("home_team")
        away = m.get("awayTeam") or m.get("away_team_name") or m.get("away_team")

        all_matches.append({
            "tournamentId": t_id,
            "tournament_id": t_id,
            "matchNumber": m_num,
            "match_number": m_num,
            "status": "skipped",
            "context": {
                "home_team": home,
                "away_team": away
            },
            "error": "Skipped due to AI quota limits"
        })

    summary_log = format_auto_sync_log(all_matches, len(matches), updated_count, failed_count, skipped_count)

    response = {
        "total_matches": len(matches),
        "updated": updated_count,
        "failed": failed_count,
        "skipped": skipped_count,
        "summary_log": summary_log,
        "matches": all_matches
    }

    notif_sent = send_notification(summary_log)
    response["notificationSent"] = notif_sent

    return response, (
        429 if quota_exhausted
        else 500 if failed_count > 0
        else 200
    )
