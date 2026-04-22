import './App.css';
import NavBar from "./components/NavBar";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import { useEffect, useState } from "react";
import WTCPage from "./pages/WTCPage";
import TournamentsPage from "./pages/TournamentsPage";

function App() {
    const [wtcs, setWtcs] = useState([]);

    const [tournaments, setTournaments] = useState({ "grouped": false, "tournaments": [] });

    const fetchTournaments = async () => {
        let url = `/tournaments`;

        const params = new URLSearchParams();
        params.set("category", "all");
        params.set("grouped", "false");

        try {
            const response = await fetch(url + "?" + params.toString());
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
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
        fetchWtcs();
        fetchTournaments();
    }, []);

    return (
        <div className="App">
            <NavBar></NavBar>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />

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

                {tournaments["tournaments"].map(tournament => (
                    <Route path={"/tournaments/" + tournament["name"] + "-" + tournament["edition"]}
                        key={tournament["id"]}
                        element={<TournamentPage
                            tournamentRWID={tournament["rw_id"]}
                            tournamentPSID={tournament["ps_id"]}
                            tournamentName={tournament["name"]}
                            tournamentEdition={tournament["edition"]}
                            tournamentLogo={tournament["horizontalLogo"]}
                            tournamentGradient={tournament["gradient"]}
                            tournamentPointsTableColor={tournament["pointsTableColor"]}
                            tournamentStructure={tournament["structure"]} />}>
                    </Route>
                ))}
            </Routes>
        </div>
    );
}

export default App;