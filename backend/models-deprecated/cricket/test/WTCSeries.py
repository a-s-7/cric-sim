from ..MatchResult import MatchResult
from .WTCMatch import WTCMatch
from .WTCTeam import WTCTeam


class WTCSeries:
    def __init__(self, name: str, id: int, numMatches: int, homeTeam: WTCTeam, awayTeam: WTCTeam):
        self.id = id
        self.seriesName = name
        self.numMatches = numMatches
        self.homeTeam = homeTeam
        self.awayTeam = awayTeam
        self.matches = []

        self.addSeriesToTeams()

    # def getJSON(self):
    #     seriesJSON = {
    #         "id": self.id,
    #         "seriesName": self.seriesName,
    #         "homeTeam": self.homeTeam.name,
    #         "homeGradient": self.homeTeam.get_gradient(),
    #         "homeFlag": self.homeTeam.get_flag(),
    #         "awayTeam": self.awayTeam.name,
    #         "awayGradient": self.awayTeam.get_gradient(),
    #         "awayFlag": self.awayTeam.get_flag(),
    #         "numMatches": self.numMatches,
    #         "matches": [m.getJSON() for m in self.matches]
    #     }
    #
    #     return seriesJSON

    def update_match(self, match_id: int, result: str):
        resultObj = None

        if str(result) == "Home-win":
            resultObj = MatchResult.HOME_WIN
        elif str(result) == "Away-win":
            resultObj = MatchResult.AWAY_WIN
        elif str(result) == "Draw":
            resultObj = MatchResult.DRAW
        elif str(result) == "None":
            self.matches[int(match_id) - 1].undoMatchResult()
            return

        self.matches[int(match_id)-1].applyMatchResult(resultObj)

    def update_deduction(self, match_id: int, team: str, deduction: int):
        teamObj = None

        if str(team) == "away-team":
            teamObj = self.awayTeam
        elif str(team) == "home-team":
            teamObj = self.homeTeam

        self.matches[int(match_id)-1].updateDeduction(teamObj, deduction)

    def get_deduction(self, match_id: int):
        return self.matches[int(match_id)-1].get_deduction()


    def addMatchDetails(self, num: int, venue: str, sdate: str, edate: str, time: str, stat: str,
                        result: str, homeDed: int, awayDed: int):
        self.matches[num - 1].set_match_info(venue, sdate, edate, time, stat, result, homeDed, awayDed)


    def addSeriesToTeams(self):
        self.homeTeam.addSeries(self)
        self.awayTeam.addSeries(self)

    def populateMatches(self):
        for i in range(1, self.numMatches+1):
            match = WTCMatch(i, self.homeTeam, self.awayTeam, self.id)
            self.addMatch(match)

    def addMatch(self, match: WTCMatch):
        if(len(self.matches) >= self.numMatches):
            raise ValueError("Cannot add more matches to the series")
        self.matches.append(match)

    def getMatch(self, matchNumber: int):
        return self.matches[matchNumber-1]

    def get_matches(self):
        return self.matches