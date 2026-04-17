from search import get_match_result
from fetch import get_match_context

# Use a real match _id from your database
match_id = "69ce0a41c64d88ca4e80d432"

context = get_match_context(match_id)
result = get_match_result(context)

print(result)