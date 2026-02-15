import './App.css';
import NavBar from "./components/NavBar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import T20LeaguePage from "./pages/T20LeaguePage";
import LeagueLandingPage from "./pages/LeagueLandingPage";
import EventsLandingPage from "./pages/EventsLandingPage";
import TournamentPage from "./pages/TournamentPage";
import React, { useEffect, useState } from "react";
import WTCPage from "./pages/WTCPage";
import IccEvents from "./pages/IccEvents";

// const DEV_ON = false;
// export const BASE_URL = DEV_ON === true ? "http://127.0.0.1:5000" : "";

function App() {
    const [leagues, setLeagues] = useState([]);
    const [wtcs, setWtcs] = useState([]);

    const [tournaments, setTournaments] = useState([]);

    const fetchTournaments = async () => {
        let url = `/tournaments?grouped=false`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchLeagues = async () => {
        let url = `/leagues/info`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setLeagues(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchWtcs = async () => {
        let url = '/wtc/info';

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setWtcs(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchLeagues();
        fetchWtcs();
        fetchTournaments();
    }, []);

    return (
        <div className="App">
            <NavBar></NavBar>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/leagues" element={<LeagueLandingPage />} />
                <Route path="/events" element={<EventsLandingPage />} />
                <Route path="/icc_events" element={<IccEvents />} />

                {leagues.map(league => (
                    <Route path={"/" + league["acronym"] + "/" + league["edition"]}
                        key={league["acronym"] + "-" + league["edition"]}
                        element={<T20LeaguePage leagueEdition={league["edition"]}
                            leagueUrlTag={league["acronym"]}
                            leagueName={league["name"]}
                            leagueLogo={league["logo"]}
                            leagueGradient={league["gradient"]}
                            leaguePointsTableColor={league["pointsTableColor"]} />
                        }>
                    </Route>))
                }

                {wtcs.map(wtc => (
                    <Route path={"/" + wtc["acronym"] + "/" + wtc["edition"]}
                        key={wtc["cycle"]}
                        element={<WTCPage wtcUrlTag={wtc["acronym"]}
                            wtcEdition={wtc["edition"]}
                            wtcLogo={wtc["logo"]}
                            wtcPointsTableColor={wtc["pointsTableColor"]}
                            wtcName={wtc["name"]}
                            wtcControlBarColor={wtc["gradient"]} />
                        }>
                    </Route>
                ))}

                {tournaments.map(tournament => (
                    <Route path={"/" + tournament["id"]}
                        key={tournament["id"]}
                        element={<TournamentPage tournamentId={tournament["id"]}
                            tournamentName={tournament["name"]}
                            tournamentEdition={tournament["edition"]}
                            tournamentLogo={tournament["horizontalLogo"]}
                            tournamentGradient={tournament["gradient"]}
                            tournamentPointsTableColor={tournament["pointsTableColor"]} />}>
                    </Route>
                ))}
            </Routes>
        </div>
    );
}

export default App;