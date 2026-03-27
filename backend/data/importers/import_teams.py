import teams_importer

team_types = ["franchise", "national"]

def main():
    for team_type in team_types:
        teams_importer.main(team_type)

if __name__ == "__main__":
    main()