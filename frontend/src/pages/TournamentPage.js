import React, { useEffect, useState } from "react";
import NewControlBar from "../components/NewControlBar";
import EventStandings from "../components/EventStandings";
import EventMatchDisplay from "../components/EventMatchDisplay";
import { calculateStandingsMovement } from "../utils/standingsUtils";


function TournamentPage({
    tournamentRWID,
    tournamentPSID,
    tournamentName,
    tournamentEdition,
    tournamentLogo,
    tournamentGradient,
    tournamentPointsTableColor,
    tournamentStructure
}) {
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedStadiums, setSelectedStadiums] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedStages, setSelectedStages] = useState([]);

    const [matchesData, setMatchesData] = useState([]);
    const [standingsData, setStandingsData] = useState({ standings: [], category: "" });
    const [mode, setMode] = useState("real-world");

    const refreshPointsTable = async () => {
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
        const params = new URLSearchParams();

        params.set("groups", selectedGroups.map(group => group.value).join(","));
        params.set("teams", selectedTeams.map(team => team.value).join(","));
        params.set("venues", selectedStadiums.map(stadium => stadium.value).join(","));
        params.set("stages", selectedStages.map(stage => stage.value).join(","));

        let url = `/tournaments/${mode === "real-world" ? tournamentRWID : tournamentPSID}/matches?${params.toString()}`;

        try {
            const response = await fetch(url);

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
        let url = `/tournaments/${mode === "real-world" ? tournamentRWID : tournamentPSID}/standings`;

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
        <div className="T20LeaguePage flex flex-col">
            <NewControlBar
                resetState={resetState}
                refreshFunction={handleRefresh}
                matchCount={matchesData?.matches?.length || 0}
                teams={selectedTeams}
                stadiums={selectedStadiums}
                groups={selectedGroups}
                stages={selectedStages}
                setSelectedTeams={setSelectedTeams}
                setSelectedStadiums={setSelectedStadiums}
                setSelectedGroups={setSelectedGroups}
                setSelectedStages={setSelectedStages}
                urlTag={mode === "real-world" ? tournamentRWID : tournamentPSID}
                logo={tournamentLogo}
                name={tournamentName}
                color={tournamentGradient}
                structure={tournamentStructure}
                matchesFiltered={matchesData?.matches || []}
                mode={mode}
                setMode={setMode}
            />


            <div className="flex flex-row w-full flex-1 overflow-hidden">
                <div className="flex flex-col w-[55%] h-full overflow-auto no-scrollbar">
                    <EventMatchDisplay
                        key={mode === "real-world" ? tournamentRWID : tournamentPSID}
                        onMatchUpdate={handleRefresh}
                        matches={matchesData}
                        tournamentId={mode === "real-world" ? tournamentRWID : tournamentPSID}
                        tournamentName={tournamentName}
                        tournamentEdition={tournamentEdition}
                        cardNeutralGradient={tournamentGradient} />
                </div>
                <div className="w-[45%] h-full overflow-auto flex flex-col no-scrollbar">
                    <EventStandings key={mode === "real-world" ? tournamentRWID : tournamentPSID} standingsData={standingsData.standings} category={standingsData.category} color={tournamentPointsTableColor} />
                </div>
            </div>
        </div>
    );
}

export default TournamentPage;
