# CRIC SIM
This is the source code for https://sport-sim.onrender.com/. This repository is a Flask website with the front end built with React and the backend with Python.

## About
Ever wonder where your favourite cricket team stands in their competition? Have you ever tried frantically calculating the seemingly endless match possibilities to determine how they could advance? Well, worry no more!

Cric Sim is a cricket simulator designed for fans of the ICC World Test Championship and major global franchise leagues like the Indian Premier League, Big Bash League, SA20, Major League Cricket, International League T20, and The Hundred. It allows users to effortlessly simulate matches and view real-time standings, all without the hassle of manual calculations.

### ICC World Test Championship
For the ICC World Test Championship, users can view the results of past matches and can control upcoming matches by selecting the result of any upcoming match in the current 2025-2027 edition. In the process of simulating matches, users can also view the resulting points table side-by-side which updates automatically. 

Finding matches by teams and venues is made a lot simpler by a dual multi-select search. To take further advantage, users can also reset or randomly simulate selected matches for advanced control over their simulation. Limited to the ICC World Test Championship, slow overrates can also be taken into consideration with support for penalty deductions.

### Franchise Leagues
Fans of other T20 franchise cricket leagues, such as the IPL and BBL, can enjoy the same set of features, with the additional capability of controlling the match scorecard. For each match, users can set the score to control the Net Run Rate and simultaneously view all changes in a more detailed points table.

## Project Structure
```
< PROJECT ROOT >
   |
   |-- backend/                    # Implements app logic
   |      |---- data/              # Team and match data
   |      |---- models/            # Python OOP classes
   |      |---- routes/            # API routes 
   |      |---- wsgi.py            # WSGI gateway
   |      |---- app.py             # Application entry 
   |      |---- requirements.txt   # Dependency list
   |
   |-- frontend/                   # Implements user interface
   |      |---- public/            # Static content
   |      |---- src/               # UI components, styling, routing

### v3