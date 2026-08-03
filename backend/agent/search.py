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
    You are a cricket match data retrieval agent. You have been given the following match context:

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
        "tossResult": "Home-win" or "Away-win" or "None",
        "tossDecision": "bat" or "bowl" or "None",
        "homeTeamRuns": number,
        "homeTeamWickets": number,
        "homeTeamBalls": number,
        "awayTeamRuns": number,
        "awayTeamWickets": number,
        "awayTeamBalls": number,
        "awayMaxBalls": number,
        "homeMaxBalls": number,
        "target": null or number 
    }}

   Rules:
    - Do not assume, infer, or deduce tossResult or tossDecision. You must explicitly find and verify both values from the available data before populating them.
    - Sole Exception: if the match was abandoned and the toss could not take place, set result to "No-result", tossResult and tossDecision to "None."
        -Only apply this exception if you can confirm from the available data that no toss happened — do not assume "No-result" alone means the toss never occurred, since matches can also be abandoned after a toss has already taken place.
    
    - homeTeamRuns, homeTeamWickets, homeTeamBalls refer to {context['home_team_name']}'s innings
    - awayTeamRuns, awayTeamWickets, awayTeamBalls refer to {context['away_team_name']}'s innings

    - Incomplete innings rule:
        - If a team's innings did not take place at all (e.g. match abandoned before that team batted, or after only one team batted), set that team's runs, wickets, and balls fields to 0 rather than null or an estimate.
        - This applies only to an innings that genuinely never started or has no recorded data. If an innings started and was interrupted mid-way, report the actual runs/wickets/balls reached at the point of interruption, not 0.

    - Balls are always represented as total balls, not overs:
        - Convert overs to balls (e.g. 20 overs = 120 balls, 18.3 overs = 111 balls)
        - For The Hundred, use its separate 100-ball format (1 innings = maximum 100 balls)

    - awayMaxBalls is the maximum number of balls the away team can bat in their innings
    - homeMaxBalls is the maximum number of balls the home team can bat in their innings

    - If a match is truncated, you must ensure that the max balls fields are updated accordingly
    - For example:
        - A T20/ODI match truncated to 10 overs per side → homeMaxBalls = 60 and awayMaxBalls = 60
        - A The Hundred match truncated to 60 balls per side → homeMaxBalls = 60 and awayMaxBalls = 60

    - Target rules:
        - target must be null unless the match was decided using the DLS (Duckworth-Lewis-Stern) method or an equivalent revised-target method due to interruption (rain, bad light, etc.)
        - Do NOT set target for a normal, uninterrupted chase. A team simply chasing the first innings score is not a DLS target — leave target as null in that case.
        - If DLS (or equivalent) was applied, set target to the revised target score the team batting second needed to win, exactly as officially declared for the match. Do not calculate or estimate this yourself — find and verify the officially stated revised target.
        - If DLS was applied, homeMaxBalls and awayMaxBalls must reflect the revised overs/balls allocated to each team's innings after the interruption, not the original scheduled length.
        - If you cannot verify with confidence whether DLS was applied or what the exact revised target was, treat this as a field that cannot be verified and return the "Could not find match result" error.

    - Tied score rules:
        - Do not include any Super Over values in the JSON fields. Only include the official match innings values.
        - For leagues/tournaments where tied matches are decided by a Super Over:
            - If the match was tied after the regular innings, set "result" based on the team that won the Super Over.
            - Do not treat the match as a tie or no-result.
        - For The Hundred, only the Eliminator and Final are decided by a Super Five:
            - If the match is a group stage match and the regular innings are tied, there is no Super Five. Treat the match as a tie and set:
             "result": "No-result" with only the official match innings values.
            - If the match is an Eliminator or Final and the regular innings are tied, a Super Five is used. Set "result" based on the team that won the Super Five.

    - If the match hasn't finished, return:
    {{
        "error": "Match has not finished"
    }}

    - If any of the above mentioned fields in the JSON object cannot be found or verified with confidence, return:
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