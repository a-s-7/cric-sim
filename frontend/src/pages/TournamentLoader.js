import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TournamentPage from "./TournamentPage";
import Spinner from "../components/Spinner";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";
import TournamentErrorPage from "./TournamentErrorPage";

function TournamentLoader() {
    const { tournamentBaseId } = useParams();
    const [tournament, setTournament] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorStatus, setErrorStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        setHasFetched(false);

        const fetchTournament = async () => {
            try {
                const response = await fetch(TOURNAMENT_ENDPOINTS.tournamentInfo(tournamentBaseId));

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));

                    setErrorStatus(error.status ?? response.status);
                    setErrorMessage(error.message ?? null);
                    setShowError(true);

                    return;
                }

                const result = await response.json();
                setTournament(result);
                setShowError(false);
            } catch (error) {
                console.error("Error fetching tournament:", error);
                setErrorStatus(null);
                setErrorMessage(null);
                setShowError(true);
            } finally {
                setHasFetched(true);
            }
        };

        fetchTournament();
    }, [tournamentBaseId]);

    if (!hasFetched) {
        return <Spinner spinDuration="1s" className="animate-[fadeIn_500ms_ease-out]" />;
    }

    if (showError || !tournament) {
        return (
            <TournamentErrorPage
                errorCode={errorStatus}
                message={errorMessage}
            />
        );
    }

    return (
        <TournamentPage
            tournamentRWID={tournament.rw_id}
            tournamentPSID={tournament.ps_id}
            tournamentName={tournament.name}
            tournamentEdition={tournament.edition}
            tournamentLogo={tournament.horizontalLogo}
            tournamentGradient={tournament.gradient}
            tournamentPointsTableColor={tournament.pointsTableColor}
            tournamentStructure={tournament.structure}
            tournamentFormat={tournament.format}
            tournamentBallsPerInnings={tournament.ballsPerInnings}
        />
    );
}

export default TournamentLoader;
