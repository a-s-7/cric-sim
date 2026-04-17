import os
from dotenv import load_dotenv
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

google_search_tool = Tool(google_search=GoogleSearch())

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Who won the most recent IPL match? Return just the team name.",
    config=GenerateContentConfig(
        tools=[google_search_tool],
        response_modalities=["TEXT"],
    ),
)

print(response.text)