# CRICsim
[CRICsim](https://cric-sim.onrender.com/) is a full-stack cricket league/event simulation platform built with React, Python, and MongoDB.

This repository contains the complete source code for the platform.

## About
Ever wonder where your favourite cricket team stands in their league or event? Have you ever tried frantically calculating the seemingly endless match possibilities to determine how they could advance? Well, worry no more!

CRICsim is an end-to-end cricket league/event simulation platform that allows users to effortlessly simulate matches and dynamically view updated standings from start to finish, all without the hassle of manual calculations.

Whether its international events or franchise leagues, CRICsim supports a wide array of events and leagues across different formats.

### Supported International Events

- ICC T20 World Cup
- ICC Cricket World Cup
- ICC Champions Trophy
- ICC World Test Championship
- Asia Cup

### Supported Franchise Leagues

- Indian Premier League (IPL)
- Big Bash League (BBL)
- SA20
- Major League Cricket (MLC)
- The Hundred
- Caribbean Premier League (CPL)
- International League T20 (ILT20)

## Features

### ICC T20 World Cup

- **Match and Standings View**: View matches and standings side-by-side in a single panel with immediate updates.
- **Match Result & Score Controls**: Adjust match results and scores for Net Run Rate (NRR) updates.
- **Multi-Select Search**: Easily find fixtures using multi-select search by stages, groups, teams and venues.
- **Clear & Simulate Matches**: Clear matches individually or by stage and simulate matches in a stage randomly.
- **Dynamic Standings**: Dynamically view standings as you simulate across each stage.
- **Real-World Simulation Mode**: View results of completed matches that get updated automatically in real-time, with the ability to simulate the remaining matches.
- **What-If Simulation Mode**: Predict the outcome of any match to instantly see how it shifts team placements.
- **Super 8 Stage Progression**: Dynamically updates team movements from the group stages into the Super 8s.
- **Knockout Bracket Tracking**: Dynamically progress teams into the semi-finals and final based on group-stage and Super 8 results.


### ICC World Test Championship
- **Interactive Match Control**: Predict outcomes (Win, Loss, Draw, or Tie) for all remaining matches in the 2025-2027 edition.
- **Dynamic Points Table**: View real-time, side-by-side updates to the standings as matches are simulated.
- **Advanced Filtering**: Easily find fixtures using a dual multi-select search by teams and venues.
- **Bulk Simulation**: Reset or randomly simulate selected matches for custom prediction scenarios.
- **Penalty Deductions**: Factor in slow overrate penalty point deductions for realistic simulation.

### Franchise Leagues
- **Scorecard Control**: Input custom scores (runs, wickets, overs) for each team to dictate match outcomes.
- **Net Run Rate (NRR) Tracking**: Instantly calculate the precise Net Run Rate impact on the standings.
- **Detailed Standings**: View comprehensive, dynamically updated points tables reflecting simulated scorecards.
- **Flexible Controls**: Enjoy match filtering, resetting, and random simulation capabilities across global leagues like the IPL, BBL, SA20, MLC, ILT20, and The Hundred.

### ICC Cricket World Cup
- **Group Stage Simulation**: Predict and simulate round-robin group matches of elite ODI teams.
- **Dynamic NRR Calculation**: Control custom run chases to watch Net Run Rate fluctuate and determine top-4 semi-finalists.
- **Knockout Bracket Tracking**: Watch the tournament bracket update dynamically as teams advance from the group stage to the semi-finals and final.

### ICC T20 World Cup
- **Multi-Group Format**: Simulate complex multi-group configurations featuring up to 20 global teams.
- **Super 8s Stage Progression**: Track team movements and qualification scenarios from the initial groups into the Super 8s.
- **Scorecard Customization**: Adjust quick-fire T20 scores and overs to simulate nail-biting finishes and NRR tie-breaker outcomes.

### ICC Champions Trophy
- **Elite Tournament Bracket**: Simulate the competitive 8-team ODI group stage and high-stakes knockout rounds.
- **Real-Time Standings**: Track group tables to see who clinches the top-two spots for the semi-finals.
- **Scorecard Customization**: Fine-tune individual team scores to calculate net run rate adjustments for tight tournament races.

### Asia Cup
- **Super Four Progression**: Simulate the unique group stage followed by the competitive Super Four round-robin.
- **Dynamic Qualification**: Instantly recalculate standings and run rates to identify the two finalists.
- **Match Control & Scoring**: Input match scores to see how different margins of victory impact continental supremacy.

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