import tournament_importer

TOURNAMENTS = {
    1: {"category": "events", "folder": "cricket-world-cup", "name": "cwc-2023.json"},
    2: {"category": "events", "folder": "t20-world-cup", "name": "t20-wc-2024.json"},
    3: {"category": "events", "folder": "champions-trophy", "name": "ct-2025.json"},
    4: {"category": "events", "folder": "t20-world-cup", "name": "t20-wc-2026.json"},
    5: {"category": "leagues", "folder": "ipl", "name": "ipl-2026.json"},
    6: {"category": "leagues", "folder": "mlc", "name": "mlc-2026.json"},
}

def main(selected_ids="All"):
    if selected_ids == "All":
        ids_to_run = TOURNAMENTS.keys()
    else:
        ids_to_run = selected_ids

    for t_id in ids_to_run:
        if t_id not in TOURNAMENTS:
            print(f"Warning: Tournament ID {t_id} not found. Skipping...")
            continue
        t_info = TOURNAMENTS[t_id]
        tournament_importer.main(t_info["category"], t_info["folder"], t_info["name"])

if __name__ == "__main__":
    main()