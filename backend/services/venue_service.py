from bson import ObjectId
from flask import abort
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from config import venues_collection

def get_venues():
    venues = list(
        venues_collection.find().sort([("country", 1), ("city", 1), ("stadium", 1)])
    )
    # venues = []

    if not venues:
        abort(404, description="No venues found.")

    for venue in venues:
        venue["_id"] = str(venue["_id"])

    return venues

def update_venue(venue_id, data):
    # Venue IDs come from the URL, so validate them before converting to ObjectId.
    if not ObjectId.is_valid(venue_id):
        abort(400, description="Invalid venue ID.")

    # Allow partial edits, but require at least one field to update.
    if not isinstance(data, dict) or not data:
        abort(400, description="A JSON object with venue fields is required.")

    # Keep this list in sync with the fields users can edit in VenueManager.
    allowed_fields = {"stadium", "city", "country"}
    unknown_fields = set(data) - allowed_fields
    
    if unknown_fields:
        abort(400, description=f"Unsupported venue fields: {', '.join(sorted(unknown_fields))}.")

    updates = {}

    # Trim before checking for blanks, so spaces alone cannot clear a field.
    for field, value in data.items():
        if not isinstance(value, str):
            abort(400, description=f"{field} must be a string.")

        value = value.strip()
        if not value:
            abort(400, description=f"{field.capitalize()} cannot be blank.")

        updates[field] = value

    # Update and return the document so the UI can display the saved venue.
    try:
        venue = venues_collection.find_one_and_update(
            {"_id": ObjectId(venue_id)},
            {"$set": updates},
            return_document=ReturnDocument.AFTER,
        )
    except DuplicateKeyError:
        abort(409, description="A venue with this stadium name already exists.")

    if venue is None:
        abort(404, description="Venue not found.")

    venue["_id"] = str(venue["_id"])
    return venue
