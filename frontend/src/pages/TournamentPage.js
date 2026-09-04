import React, { useEffect, useState } from "react";
import ControlBar from "../components/ControlBar";
import StandingsPanel from "../components/standings/StandingsPanel";
import MatchesPanel from "../components/matches/MatchesPanel";
import { calculateStandingsMovement } from "../utils/standingsUtils";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";


function TournamentPage({
    tournamentRWID,
    tournamentPSID,
    tournamentName,
    tournamentEdition,
    tournamentLogo,
    tournamentGradient,
    tournamentPointsTableColor,
    tournamentStructure,
    tournamentFormat
}) {
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedStadiums, setSelectedStadiums] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedStages, setSelectedStages] = useState([]);

    const [matchesData, setMatchesData] = useState([]);
    const [standingsData, setStandingsData] = useState({ standings: [], category: "" });
    const [mode, setMode] = useState("real-world");

    const refreshPointsTable = async () => {
        if (tournamentStructure === "knockout") return;
        await fetchStandings();
    }

    const refreshMatchArea = async () => {
        await fetchMatches();
    }

    const handleRefresh = async () => {
        await refreshMatchArea();
        await refreshPointsTable();
    }

    const fetchMatches = async () => {
        const tournamentId = mode === "real-world" ? tournamentRWID : tournamentPSID
        const url = TOURNAMENT_ENDPOINTS.tournamentMatches(tournamentId)

        const params = new URLSearchParams();
        params.set("groups", selectedGroups.map(group => group.value).join(","));
        params.set("teams", selectedTeams.map(team => team.value).join(","));
        params.set("venues", selectedStadiums.map(stadium => stadium.value).join(","));
        params.set("stages", selectedStages.map(stage => stage.value).join(","));

        try {
            const response = await fetch(`${url}?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setMatchesData(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchStandings = async () => {
        if (tournamentStructure === "knockout") {
            return;
        }

        const tournamentId = mode === "real-world" ? tournamentRWID : tournamentPSID
        const url = TOURNAMENT_ENDPOINTS.tournamentStandings(tournamentId)

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            const { standings, category } = result;

            // Calculate the position changes (movement) compared to what we saw last
            const updatedStandings = calculateStandingsMovement(standingsData.standings || [], standings);
            setStandingsData({ standings: updatedStandings, category });
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const resetState = () => {
        setSelectedTeams([]);
        setSelectedStadiums([]);
        setSelectedGroups([]);
        setSelectedStages([]);
        setMatchesData([]);
        setStandingsData({ standings: [], category: "" });
    }

    useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line
    }, [mode, selectedTeams, selectedStadiums, selectedGroups, selectedStages]);

    return (
        <div className="h-[93%] flex flex-col" style={{ backgroundColor: tournamentGradient }}>
            <ControlBar
                resetState={resetState}
                refreshFunction={handleRefresh}
                teams={selectedTeams}
                stadiums={selectedStadiums}
                groups={selectedGroups}
                stages={selectedStages}
                setSelectedTeams={setSelectedTeams}
                setSelectedStadiums={setSelectedStadiums}
                setSelectedGroups={setSelectedGroups}
                setSelectedStages={setSelectedStages}
                tournamentId={mode === "real-world" ? tournamentRWID : tournamentPSID}
                logo={tournamentLogo}
                name={tournamentName}
                color={tournamentGradient}
                structure={tournamentStructure}
                matchesFiltered={matchesData?.matches || []}
                mode={mode}
                setMode={setMode}
            />


            <div className="flex flex-row w-full flex-1 overflow-hidden">
                <div className={`flex flex-col ${tournamentStructure === "knockout" ? "w-full" : "w-[55%]"} h-full overflow-auto no-scrollbar`}>
                    <MatchesPanel
                        key={mode === "real-world" ? tournamentRWID : tournamentPSID}
                        onMatchUpdate={handleRefresh}
                        matches={matchesData}
                        tournamentId={mode === "real-world" ? tournamentRWID : tournamentPSID}
                        tournamentName={tournamentName}
                        tournamentEdition={tournamentEdition}
                        cardNeutralGradient={tournamentGradient}
                        structure={tournamentStructure} />
                </div>
                {tournamentStructure !== "knockout" && (
                    <div className="w-[45%] h-full overflow-auto flex flex-col no-scrollbar">
                        <StandingsPanel key={mode === "real-world" ? tournamentRWID : tournamentPSID}
                            standingsData={standingsData.standings}
                            category={standingsData.category}
                            color={tournamentPointsTableColor}
                            format={tournamentFormat} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default TournamentPage;
