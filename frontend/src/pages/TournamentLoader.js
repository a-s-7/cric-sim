import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TournamentPage from "./TournamentPage";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";

function TournamentLoader() {
    const { tournamentBaseId } = useParams();
    const [tournament, setTournament] = useState(null);

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const response = await fetch(TOURNAMENT_ENDPOINTS.tournamentInfo(tournamentBaseId));

                if (!response.ok) {
                    throw new Error("Response was not ok");
                }

                const result = await response.json();
                setTournament(result);
            } catch (error) {
                console.error("Error fetching tournament:", error);
            }
        };

        fetchTournament();
    }, [tournamentBaseId]);

    if (!tournament) {
        return null;
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
        />
    );
}

export default TournamentLoader;