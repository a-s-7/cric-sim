import json
from .T20Match import T20Match
from .T20Team import T20Team
from .T20League import T20League


class T20LeagueInitializer:

    @staticmethod
    def initializeLeague(name, teamData, matchesData):
        league = T20League(name)
        T20LeagueInitializer.populateLeague(league, teamData, matchesData)

        return league

    @staticmethod
    def populateLeague(league: T20League, teamData, matchesData):
        T20LeagueInitializer.populateTeams(league, teamData)
        T20LeagueInitializer.populateMatches(league, matchesData)

    @staticmethod
    def populateTeams(league: T20League, teamData):
        for team in teamData:
            t20Team = T20Team(team["name"], team["acronym"])

            t20Team.set_gradient(team["gradient"])
            t20Team.set_logo(team["logo"])

            league.add_team(t20Team)

    @staticmethod
    def populateMatches(league: T20League, matchesData):
        for m in matchesData:
            mNum = m["MatchNumber"]

            hTeam = league.get_team(m["HomeTeam"])
            aTeam = league.get_team(m["AwayTeam"])

            match = T20Match(mNum, hTeam, aTeam)

            match.setMatchVenue(m["Location"])
            match.setMatchDateTime(m["DateUtc"])
            match.set_match_status(m["status"])
            print(m["result"])
            match.set_match_result(m["result"])

            if m["result"] != "None":
                match.set_team_score("Home", m["homeTeamRuns"], m["homeTeamWickets"], m["homeTeamOvers"])
                match.set_team_score("Away", m["awayTeamRuns"], m["awayTeamWickets"], m["awayTeamOvers"])
                match.set_team_nrrs()

            league.add_match(match)
