from search import get_match_result
from fetch import get_match_context

tournament_id = "thu-2025-rw"
match_number = 1

context = get_match_context(tournament_id, match_number)

print(context)

result = get_match_result(context)

print(result)