import os
import json
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

def send_notification(message):
    try:
        send_discord_notification(message)
        return True
    except Exception as e:
        logging.error(f"Failed to send notification: {e}")
        return False

def send_discord_notification(message):
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    if not webhook_url:
        raise RuntimeError("DISCORD_WEBHOOK_URL is not configured")

    if isinstance(message, (dict, list)):
        content_str = f"```json\n{json.dumps(message, indent=2)}\n```"
    else:
        content_str = str(message)

    response = requests.post(
        webhook_url,
        json={"content": content_str},
        timeout=10
    )

    response.raise_for_status()