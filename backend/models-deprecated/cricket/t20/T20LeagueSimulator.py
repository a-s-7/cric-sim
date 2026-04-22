from .T20LeagueInitializer import T20LeagueInitializer
from ..MatchResult import MatchResult

import random

class T20LeagueSimulator:
    def __init__(self, name: str, teamPath: str, schedulePath: str):
        self.league = T20LeagueInitializer.initializeLeague(name, teamPath, schedulePath)

        self.startSimulator()

    def startSimulator(self):
        print(f"{self.league.name} Simulator")
        status = None

        while status != 'EXIT':
            print("")
            self.displayMenu()
            status = input("---Enter your choice: ")
            print("")
            if status == 'SCH':
                self.league.print_schedule()
                print("")
            elif status == 'SIM':
                print("***********************************SIMULATION MODE ACTIVE***********************************")

                if self.league.check_if_all_matches_complete():
                    self.league.clear_all_match_results()

                currentIndex = 1
                simComplete = False

                while not simComplete:
                    print("")
                    simType = input("---Enter 'A' for automatic simulation, 'M' for manual simulation: ")

                    if simType == 'A':
                        mStat = False

                        while not mStat:
                            matchNum = input("---Enter match number to simulate up to (and including): ")
                            if (int(matchNum) > self.league.get_number_of_matches() or int(matchNum) < currentIndex):
                                print("Invalid match number")
                            else:
                                mStat = True

                        self.executeRandomSimulation(currentIndex, int(matchNum))
                        currentIndex = int(matchNum) + 1

                        pTable = input("---Enter 'P' to view points table, press 'ENTER' to continue: ")

                        if pTable == 'P':
                            print("")
                            self.league.print_points_table()

                    elif simType == 'M':
                        for match in self.league.matchList[currentIndex - 1:]:
                            print("")
                            print("{:<15} {:<30} {:<30} {:<45} {:<15}".format("Match Number", "Home Team", "Away Team",
                                                                              "Location", "Date"))
                            print("{:<15} {:<30} {:<30} {:<45} {:<15}".format(match.matchNumber, match.homeTeam.name,
                                                                              match.awayTeam.name, match.venue,
                                                                              match.date))

                            print("")
                            secondStatus = input(
                                "---Enter 'H' for Home team win, 'A' for 'Away Team', 'NR' for no result: ")
                            if secondStatus == 'H':
                                match.applyMatchResult(MatchResult.HOME_WIN)
                            elif secondStatus == 'A':
                                match.applyMatchResult(MatchResult.AWAY_WIN)
                            else:
                                match.applyMatchResult(MatchResult.NO_RESULT)

                            currentIndex += 1

                            pTable = input(
                                "---Enter 'P' to view points table, 'SWITCH' to switch sim mode, press 'ENTER' to continue: ")

                            if pTable == 'P':
                                print("")
                                self.league.print_points_table()
                            elif pTable == 'SWITCH':
                                break;

                    if (self.league.check_if_all_matches_complete()):
                        simComplete = True

                print("\nSIMULATION COMPLETE")

    def displayMenu(self):
        print("MENU")
        print("SCH - View Match Schedule")
        print("SIM - Simulate Matches")
        print("EXIT - Exit Simulator")

    def executeRandomSimulation(self, startNum: int, endNum: int):
        for match in self.league.matchList[startNum - 1:endNum]:
            rand_decimal = random.uniform(0, 1)

            if 0 <= rand_decimal <= 0.475:
                match.applyMatchResult(MatchResult.HOME_WIN)
            elif 0.475 < rand_decimal <= 0.95:
                match.applyMatchResult(MatchResult.AWAY_WIN)
            else:
                match.applyMatchResult(MatchResult.NO_RESULT)
