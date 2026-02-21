import React, { useEffect, useState } from "react";
import NewControlBar from "../components/NewControlBar";
import EventStandings from "../components/EventStandings";
import EventMatchDisplay from "../components/EventMatchDisplay";
import { calculateStandingsMovement } from "../utils/standingsUtils";


function TournamentPage({ tournamentId, tournamentName, tournamentEdition, tournamentLogo, tournamentGradient, tournamentPointsTableColor }) {
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedStadiums, setSelectedStadiums] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);

    const [matchesData, setMatchesData] = useState([]);
    const [standingsData, setStandingsData] = useState([]);

    const [matchAreaKey, setMatchAreaKey] = useState(0);

    const refreshPointsTable = async () => {
        await fetchStandings();
    }

    const refreshMatchArea = async () => {
        await fetchMatches();
        setMatchAreaKey(prevKey => prevKey + 1);
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

        let url = `/tournaments/${tournamentId}/matches?${params.toString()}`;

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
        let url = `/tournaments/${tournamentId}/standings`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const newStandingsData = await response.json();

            // Calculate the position changes (movement) compared to what we saw last
            const updatedStandings = calculateStandingsMovement(standingsData, newStandingsData);
            setStandingsData(updatedStandings);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // Removed the buggy calculatePointsTableChanges helper as it's now integrated and fixed in fetchStandings



    const resetState = async () => {
        await setSelectedTeams([]);
        await setSelectedStadiums([]);
        await setSelectedGroups([]);
        await setMatchesData([]);
        await setStandingsData([]);
    }


    useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line
    }, [selectedTeams, selectedStadiums, selectedGroups]);

    useEffect(() => {
        resetState();
        handleRefresh();
        // eslint-disable-next-line
    }, [tournamentId]);


    return (
        <div className="T20LeaguePage flex flex-col overflow-hidden">
            <NewControlBar
                refreshFunction={handleRefresh}
                matchCount={matchesData?.matches?.length || 0}
                teams={selectedTeams}
                stadiums={selectedStadiums}
                groups={selectedGroups}
                setSelectedTeams={setSelectedTeams}
                setSelectedStadiums={setSelectedStadiums}
                setSelectedGroups={setSelectedGroups}
                urlTag={tournamentId}
                logo={tournamentLogo}
                name={tournamentName}
                color={tournamentGradient}
                edition={tournamentEdition}
                matchesFiltered={matchesData?.matches || []}
            />

            <div className="flex flex-row w-full flex-1 overflow-hidden">
                <div className="flex flex-col w-[55%] h-full overflow-auto">
                    <EventMatchDisplay
                        key={matchAreaKey}
                        onMatchUpdate={refreshPointsTable}
                        matches={matchesData}
                        tournamentUrlTag={tournamentId}
                        cardNeutralGradient={tournamentGradient} />
                </div>
                <div className="w-[45%] h-full overflow-auto flex flex-col">
                    <EventStandings standingsData={standingsData} color={tournamentPointsTableColor} />
                </div>
            </div>
        </div>
    );
}

export default TournamentPage;
