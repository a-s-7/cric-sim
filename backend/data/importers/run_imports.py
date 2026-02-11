import venues_importer
import icc_teams_importer
import icc_tournament_importer

def main():
    venues_importer.main()
    icc_teams_importer.main()
    icc_tournament_importer.main()

if __name__ == "__main__":
    main()