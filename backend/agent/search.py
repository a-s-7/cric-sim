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
    Ensure that the result provided is fully correct. Check and validate every single field.

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
        "awayMaxBalls": number,
        "homeMaxBalls": number,
    }}

    Rules:
    - homeTeamRuns, homeTeamWickets, homeTeamBalls refer to {context['home_team_name']}'s innings
    - awayTeamRuns, awayTeamWickets, awayTeamBalls refer to {context['away_team_name']}'s innings
    - For balls: convert overs to balls (e.g. 20 overs = 120 balls, 18.3 overs = 111 balls)

    - awayMaxBalls is the maximum number of balls the away team can bat in their innings
    - homeMaxBalls is the maximum number of balls the home team can bat in their innings
    - If a match is truncated, you must ensure that the max balls fields are updated accordingly
    - For example, if a match is truncated to 10 overs a side, then homeMaxBalls = 60 and awayMaxBalls = 60
    
    - If the match hasn't finished, return:
    {{
        "error": "Match has not finished"
    }}
    - If the match result is not found or there is any other error preventing you from finding the result, return:
    {{
        "error": "Could not find match result"
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

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[!] Failed to parse model response: {e}\nRaw output: {raw}")
        return {"error": f"Invalid JSON from model: {e}"}