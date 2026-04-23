import os
import json
import re
from dotenv import load_dotenv
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_match_result(context):
    google_search_tool = Tool(google_search=GoogleSearch())

    prompt = f"""
    You are a cricket data agent. You have been given the following match context:

    - Home Team: {context['home_team_name']} ({context['home_team_acronym']})
    - Away Team: {context['away_team_name']} ({context['away_team_acronym']})
    - Date: {context['date']}
    - Tournament/League: {context['tournament_name']} {context['tournament_edition']}

    Using this context, search the web and find the result of this specific match.
    The home and away team designations in your response must correspond exactly to the
    home and away teams provided above.

    Return ONLY a valid JSON object with no extra text, no markdown, no explanation.
    The JSON must have exactly these fields:
    {{
        "result": "Home-win" or "Away-win" or "No-result",
        "tossResult": "Home-win" or "Away-win",
        "tossDecision": "bat" or "bowl",
        "homeTeamRuns": number,
        "homeTeamWickets": number,
        "homeTeamBalls": number,
        "awayTeamRuns": number,
        "awayTeamWickets": number,
        "awayTeamBalls": number,
        "status": "complete"
    }}

    Rules:
    - homeTeamRuns, homeTeamWickets, homeTeamBalls refer to {context['home_team_name']}'s innings
    - awayTeamRuns, awayTeamWickets, awayTeamBalls refer to {context['away_team_name']}'s innings
    - For balls: convert overs to balls (e.g. 20 overs = 120 balls, 18.3 overs = 111 balls)
    - If no result is found, return 
    {{
        "error": "No result found"
    }}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=GenerateContentConfig(
            tools=[google_search_tool],
            response_modalities=["TEXT"],
        ),
    )

    # Strip markdown fences if present
    raw = response.text.strip()
    raw = re.sub(r"```json|```", "", raw).strip()

    return json.loads(raw)