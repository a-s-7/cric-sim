class CricketTeam:
    def __init__(self, name, acronym):
        self.name = name
        self.acronym = acronym
        self.played = 0
        self.won = 0
        self.lost = 0
        self.matchList = []

    def change_name(self, newname):
        self.name = newname
        
    def change_acronym(self, newAcronym):
        self.acronym = newAcronym
    
    def getname(self):
        return self.name
    
    def getAcronym(self):
        return self.acronym

    ## Played ---------------------
    def increment_played(self):
        self.played += 1
    
    def decrement_played(self):
        if self.played > 0:
            self.played -= 1
        else:
            raise ValueError("Cannot decrement PLAYED below 0")

    ## Won ---------------------
    def increment_won(self):
        self.won += 1
    
    def decrement_won(self):
        if self.won > 0:
            self.won -= 1
        else:
            raise ValueError("Cannot decrement WON below 0")

    ## Lost ---------------------
    def increment_loss(self):
        self.lost += 1
    
    def decrement_loss(self):
        if self.lost > 0:
            self.lost -= 1
        else:
            raise ValueError("Cannot decrement LOST below 0")

    def addMatch(self, match, role: str):
        self.matchList.append({'match': match, 'role': role})