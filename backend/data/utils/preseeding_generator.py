# %%
import json
from itertools import permutations, product

# Replace with the real teams once the draw is known
group_a = ["India", "Australia", "Pakistan", "Zimbabwe", "Afghanistan", "Qualifier A"]
group_b = ["New Zealand", "England", "South Africa", "Sri Lanka", "Bangladesh", "Qualifier B"]

def to_rows(a, b):
    return [
        {"pos": i + 1,
         "A": a[i] if i < len(a) else None,
         "B": b[i] if i < len(b) else None}
        for i in range(4)
    ]

def generate():
    yield from product(permutations(group_a, 3), permutations(group_b, 4))
    yield from product(permutations(group_a, 4), permutations(group_b, 3))

def format_scenario(i, a, b):
    rows = ",\n".join(
        "      { " + json.dumps(r)[1:-1] + " }" for r in to_rows(a, b)
    )
    return f'  {{\n    "id": {i},\n    "positions": [\n{rows}\n    ]\n  }}'

if __name__ == "__main__":
    with open("scenarios.json", "w") as f:
        f.write("[\n")
        f.write(",\n".join(
            format_scenario(i, a, b) for i, (a, b) in enumerate(generate())
        ))
        f.write("\n]\n")
    print("Done")