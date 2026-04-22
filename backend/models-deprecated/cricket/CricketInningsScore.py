from .CricketFormat import CricketFormat


class CricketInningsScore:
    T20_OVER_LIMIT = 20
    ODI_OVER_LIMIT = 50

    def __init__(self, runs: int, wickets: int, overs: int, balls: int, format: CricketFormat):
        self.runs = runs
        self.wickets = wickets
        self.overs = overs
        self.balls = balls
        self.totalBalls = (self.overs * 6) + self.balls

        self.format = format

    def check_score(self, runs: int, overs: int, balls: int, format: CricketFormat):
        # Check if parameters are of correct type
        if not isinstance(runs, int) or not isinstance(overs, int) or not isinstance(balls, int):
            raise ValueError("Runs, overs, and balls all must be integers")

        if not isinstance(format, CricketFormat):
            raise ValueError("A valid CricketFormat must be provided")

        # Check if parameters are non-negative and within general bounds
        if (runs < 0):
            raise ValueError("Runs cannot be negative")

        if overs < 0:
            raise ValueError("Overs cannot be negative")

        if balls < 0 or balls >= 6:
            raise ValueError("Balls must be between [0, 5]")

        # Check if overs.balls is valid (specific to the format)
        if format != CricketFormat.TEST:
            overLimit = CricketInningsScore.ODI_OVER_LIMIT

            if (format == CricketFormat.T20):
                overLimit = CricketInningsScore.T20_OVER_LIMIT

            if overs > overLimit:
                raise ValueError(f"Overs must be between [0, {overLimit}] for {format}")

            if overs == overLimit and balls > 0:
                raise ValueError(f"Balls cannot be greater than 0 if overs is {overLimit} for {format}")

    def getOvers(self):
        return self.overs
    
    def getBalls(self):
        return self.balls
    
    def getRuns(self):
        return self.runs
    
    def getTotalBalls(self):
        return self.totalBalls

    def get_english_overs(self):
        return f"{self.overs}.{self.balls}"

    def get_wickets(self):
        return self.wickets