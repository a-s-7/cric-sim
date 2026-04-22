import json

from .WTC import WTC
from .WTCSeries import WTCSeries
from .WTCTeam import WTCTeam

class WTCInitializer:
    wtc = None

    @staticmethod
    def initializeWTC(name: str, start: int, end: int, teamPath: str, seriesPath):
        wtc = WTC(name, start, end)
        WTCInitializer.populateTeams(wtc, teamPath)
        WTCInitializer.populateSeries(wtc, seriesPath)

        return wtc

    @staticmethod
    def populateTeams(wtc: WTC, teamsPath: str):
        with open(teamsPath, 'r') as file:
            data = json.load(file)

        for team in data["teams"]:
            wtcTeam = WTCTeam(team["team_name"], team["acronym"])
            wtcTeam.setGradient(team["gradient"])
            wtcTeam.setFlag(team["flag"])

            wtc.addTeam(wtcTeam)

    @staticmethod
    def populateSeries(wtc: WTC, seriesPath: str):
        with open(seriesPath, 'r') as file:
            data = json.load(file)

        for series in data["series"]:
            homeTeam = wtc.get_Team(series["homeTeam"])
            awayTeam = wtc.get_Team(series["awayTeam"])
            wtcSeries = WTCSeries(series["seriesName"], series["seriesId"], series["numMatches"], homeTeam, awayTeam)
            wtcSeries.populateMatches()

            for index, match in enumerate(series["matches"]):
                wtcSeries.addMatchDetails(index + 1, match["venue"], match["startDate"], match["endDate"],
                                          match["startTime"], match["status"], match["result"],
                                          match["homeDed"], match["awayDed"])

            wtc.add_series(wtcSeries)

        wtc.add_matches_to_list()
        wtc.sort_wtc_match_list()
        wtc.sort_teams_match_lists()
