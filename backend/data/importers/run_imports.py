import import_venues
import import_teams
import import_events_leagues

TOURNAMENTS = {
    1: {"category": "events", "folder": "cricket-world-cup", "name": "cwc-2023.json"},
    2: {"category": "events", "folder": "t20-world-cup", "name": "t20-wc-2024.json"},
    3: {"category": "events", "folder": "champions-trophy", "name": "ct-2025.json"},
    4: {"category": "events", "folder": "t20-world-cup", "name": "t20-wc-2026.json"},
    5: {"category": "leagues", "folder": "ipl", "name": "ipl-2026.json"},
    6: {"category": "leagues", "folder": "mlc", "name": "mlc-2026.json"},
    7: {"category": "events", "folder": "t20-world-cup", "name": "w-t20-wc-2026.json"},
    8: {"category": "leagues", "folder": "ipl", "name": "ipl-2025.json"},
    9: {"category": "leagues", "folder": "mlc", "name": "mlc-2025.json"},
    10: {"category": "leagues", "folder": "ilt20", "name": "ilt20-2025.json"},
    11: {"category": "leagues", "folder": "ilt20", "name": "ilt20-2025-26.json"},
    12: {"category": "leagues", "folder": "bbl", "name": "bbl-2024-25.json"},
    13: {"category": "leagues", "folder": "thu", "name": "thu-2025.json"},
    14: {"category": "leagues", "folder": "thu", "name": "thu-2026.json"},
    15: {"category": "events", "folder": "asia-cup", "name": "ac-2023.json"},
    16: {"category": "events", "folder": "asia-cup", "name": "ac-2025.json"},
    17: {"category": "events", "folder": "cricket-world-cup", "name": "cwc-2027.json"},
    18: {"category": "events", "folder": "world-test-championship", "name": "wtc-2025.json"},
    19: {"category": "events", "folder": "asia-cup", "name": "w-ac-2026.json"},
    20: {"category": "leagues", "folder": "etpl", "name": "etpl-2026.json"},
    21: {"category": "events", "folder": "asian-games", "name": "ag-2026.json"},
    22: {"category": "events", "folder": "asian-games", "name": "w-ag-2026.json"},
    23: {"category": "events", "folder": "olympics", "name": "oly-2028.json"},
    24: {"category": "events", "folder": "olympics", "name": "w-oly-2028.json"},
    25: {"category": "leagues", "folder": "bbl", "name": "bbl-2025-26.json"},
    26: {"category": "leagues", "folder": "bbl", "name": "bbl-2026-27.json"},
    27: {"category": "leagues", "folder": "ilt20", "name": "ilt20-2026.json"},
    28: {"category": "leagues", "folder": "sa20", "name": "sa20-2025.json"},
    29: {"category": "leagues", "folder": "sa20", "name": "sa20-2026.json"},
    30: {"category": "leagues", "folder": "sa20", "name": "sa20-2027.json"},
    31: {"category": "leagues", "folder": "mlc", "name": "mlc-2024.json"},
    32: {"category": "leagues", "folder": "ipl", "name": "ipl-2024.json"},
    33: {"category": "leagues", "folder": "cpl", "name": "cpl-2026.json"},
    34: {"category": "leagues", "folder": "cpl", "name": "cpl-2025.json"},
    35: {"category": "leagues", "folder": "cpl", "name": "cpl-2024.json"},
}

def main():
    import_venues.main()
    import_teams.main()
    import_events_leagues.main(TOURNAMENTS, [5, 6, 8, 9, 10, 20, 11, 12, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35])

if __name__ == "__main__":
    main()
