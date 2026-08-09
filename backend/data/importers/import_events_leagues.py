import tournament_importer 
import wtc_importer

def main(tournaments=[], selected_ids="All"):
    if selected_ids == "All":
        ids_to_run = tournaments.keys()
    else:
        ids_to_run = selected_ids

    for t_id in ids_to_run:
        if t_id not in tournaments:
            print(f"Warning: Tournament ID {t_id} not found. Skipping...")
            continue
        t_info = tournaments[t_id]

        importer = wtc_importer if t_info["folder"] == "world-test-championship" else tournament_importer

        for real_value in (True, False):
            importer.main(t_info["category"], t_info["folder"], t_info["name"], auto_update=False, realWorld=real_value)

if __name__ == "__main__":
    main(selected_ids=[6])