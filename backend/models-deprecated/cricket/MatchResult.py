from enum import Enum


class MatchResult(Enum):
    HOME_WIN = "Home-win"
    AWAY_WIN = "Away-win"
    NO_RESULT = "No-result"
    DRAW = "Draw"
    TIE = "Tie"
    NONE = "None"
