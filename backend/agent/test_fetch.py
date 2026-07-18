from fetch import get_match_context

# Use a real match _id from your database
tournament_id = "ipl-2026-rw"
match_number = 1

context = get_match_context(tournament_id, match_number)
print(context)