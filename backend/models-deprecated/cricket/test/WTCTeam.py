from ..CricketTeam import CricketTeam
from ..MatchResult import MatchResult


class WTCTeam(CricketTeam):

    def __init__(self, name, acronym):
        super().__init__(name, acronym)
        self.draw = 0
        self.tie = 0
        self.deduction = 0
        self.numMatches = 0
        self.flag = ""
        self.gradient = ""

        self.seriesList = []

    def sort_match_list(self):
        self.matchList = sorted(self.matchList, key=lambda m: m['match'].startDate)

    def get_points_table_json(self):
        return {
            "name": self.name,
            "played": self.played,
            "won": self.won,
            "lost": self.lost,
            "draw": self.draw,
            "deduction": self.deduction,
            "points": self.get_points(),
            "pointsPercentage": self.get_points_percentage(),
            "flag": self.flag,
            "previous5": self.get_previous_5_matches(),
        }

    def get_previous_5_matches(self):
        results = []

        for i in range(self.numMatches, 0, -1):
            # {'match': match, 'role': role}

            if len(results) == 5:
                break

            m = self.matchList[i - 1]
            match = m["match"]

            if match.matchResult != MatchResult.NONE:
                status = match.check_team_winner(m['role'])
                results.append(status)

        if len(results) < 5:
            for i in range(5 - len(results)):
                results.append(None)

        return results

    def get_basic_json(self):
        return {
            "flag": self.flag,
            "gradient": self.gradient
        }

    def setFlag(self, link: str):
        self.flag = link

    def get_flag(self):
        return self.flag

    def setGradient(self, gradient: str):
        self.gradient = gradient

    def get_gradient(self):
        return self.gradient

    def addSeries(self, series):
        self.seriesList.append(series)
        self.numMatches += series.numMatches

    def increment_draw(self):
        self.draw += 1

    def decrement_draw(self):
        if self.draw > 0:
            self.draw -= 1
        else:
            raise ValueError("Cannot decrement DRAW below 0")

    def increment_tie(self):
        self.tie += 1

    def decrement_tie(self):
        if self.tie > 0:
            self.tie -= 1
        else:
            raise ValueError("Cannot decrement TIE below 0")

    def increase_deduction(self, deduction: int):
        self.deduction += int(deduction)

    def decrease_deduction(self, deduction: int):
        if self.deduction - int(deduction) < 0:
            raise ValueError("Cannot remove DEDUCTION below 0")

        self.deduction -= int(deduction)

    def get_non_deducted_points(self):
        return (self.won * 12) + (self.tie * 6) + (self.draw * 4)

    def get_points(self):
        return self.get_non_deducted_points() - self.deduction

    def get_potential_points(self):
        return self.played * 12

    def get_points_percentage(self):
        a = self.get_points()
        b = self.get_potential_points()

        if (b == 0):
            return 0
        else:
            return float((a / b) * 100)
