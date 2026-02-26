import json
import os
from pymongo import MongoClient
from pymongo.errors import BulkWriteError

def main():
    if os.getenv("RENDER_STATUS") != "TRUE":
        from dotenv import load_dotenv
        load_dotenv()

    connection_string = os.getenv('MONGODB_URI')

    if not connection_string:
        raise ValueError("MONGODB_URI not found in environment variables")

    client = MongoClient(connection_string)
    
    client.drop_database("events")

if __name__ == "__main__":
    main()
