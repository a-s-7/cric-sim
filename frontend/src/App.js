import './App.css';
import NavBar from "./components/NavBar";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TournamentLoader from "./pages/TournamentLoader";
import TournamentsPage from "./pages/TournamentsPage";

function App() {
    return (
        <div className="App">
            <NavBar></NavBar>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/tournaments/:tournamentId" element={<TournamentLoader />} />
            </Routes>
        </div>
    );
}

export default App;