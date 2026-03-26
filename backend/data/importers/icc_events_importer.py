import icc_tournament_importer

event_folders = ["champions-trophy", "cricket-world-cup", "t20-world-cup", "t20-world-cup"]
file_names = ["ct-2025.json", "cwc-2023.json", "t20-wc-2024.json", "t20-wc-2026.json"]

def main():
    for i in range(len(event_folders)):
        icc_tournament_importer.main(event_folders[i], file_names[i])

if __name__ == "__main__":
    main()