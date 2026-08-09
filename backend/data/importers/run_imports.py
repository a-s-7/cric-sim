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
    18: {"category": "events", "folder": "world-test-championship", "name": "wtc-2025.json"}
}

def main():
    import_venues.main()
    import_teams.main()
    import_events_leagues.main(TOURNAMENTS, [5, 16, 18])

if __name__ == "__main__":
    main()