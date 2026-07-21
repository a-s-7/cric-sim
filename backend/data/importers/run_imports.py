import import_venues
import import_teams
import import_events_leagues

def main():
    import_venues.main()
    import_teams.main()
    import_events_leagues.main([5, 13, 14])

if __name__ == "__main__":
    main()