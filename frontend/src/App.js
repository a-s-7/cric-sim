import './App.css';
import NavBar from "./components/NavBar";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import { useEffect, useState } from "react";
import TournamentsPage from "./pages/TournamentsPage";

function App() {
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

    useEffect(() => {
        fetchTournaments();
    }, []);

    return (
        <div className="App">
            <NavBar></NavBar>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />

                {tournaments["tournaments"].map(tournament => (
                    <Route path={"/tournaments/" + tournament["id"]}
                        key={tournament["id"]}
                        element={
                            <TournamentPage
                                tournamentRWID={tournament["rw_id"]}
                                tournamentPSID={tournament["ps_id"]}
                                tournamentName={tournament["name"]}
                                tournamentEdition={tournament["edition"]}
                                tournamentLogo={tournament["horizontalLogo"]}
                                tournamentGradient={tournament["gradient"]}
                                tournamentPointsTableColor={tournament["pointsTableColor"]}
                                tournamentStructure={tournament["structure"]}
                                tournamentFormat={tournament["format"]} />} />
                ))}
            </Routes>
        </div>
    );
}

export default App;