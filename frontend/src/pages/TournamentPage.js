import React, { useEffect, useState } from "react";
import NewControlBar from "../components/NewControlBar";
import EventStandings from "../components/EventStandings";
import EventMatchDisplay from "../components/EventMatchDisplay";

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
        setMatchAreaKey(matchAreaKey + 1);
    }

    const handleRefresh = async () => {
        await refreshMatchArea();
        await refreshPointsTable();
    }

    const fetchMatches = async () => {
        // let teamVal = "All";
        // let stadiumVal = "All";

        // if (selectedTeams.length > 0) {
        //     teamVal = selectedTeams.map(team => team.value).join("-");
        // }

        // if (selectedStadiums.length > 0) {
        //     stadiumVal = selectedStadiums.map(stadium => stadium.value).join(",");
        // }

        // let url = `/leagues/${tournamentId}/${leagueEdition}/matches/${teamVal}/${stadiumVal}`;

        // try {
        //     const response = await fetch(url);
        //     if (!response.ok) {
        //         throw new Error("Response was not ok");
        //     }
        //     const result = await response.json();
        //     setMatchesData(result);
        // } catch (error) {
        //     console.error("Error fetching data:", error);
        // }
    };

    const fetchStandings = async () => {
        let url = `/tournaments/${tournamentId}/standings`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();

            // if (pointsTableData.length > 0) {
            //     const diffs = calculatePointsTableChanges(result);
            //     result.forEach(team => {
            //         team["diff"] = diffs.get(team.acronym);
            //     });
            // } else {
            //     result.forEach(team => {
            //         team["diff"] = 0;
            //     });
            // }
            setStandingsData(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    const resetState = async () => {
        await setSelectedTeams([]);
        await setSelectedStadiums([]);
        await setMatchesData([]);
        await setStandingsData([]);
    }


    useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line
    }, [selectedTeams, selectedStadiums]);

    useEffect(() => {
        resetState();
        handleRefresh();
        // eslint-disable-next-line
    }, [tournamentId]);


    return (
        <div className="T20LeaguePage flex flex-col overflow-hidden">
            <NewControlBar
                refreshFunction={handleRefresh}
                matchCount={0}
                teams={selectedTeams}
                stadiums={selectedStadiums}
                groups={selectedGroups}
                sst={setSelectedTeams}
                setStadiums={setSelectedStadiums}
                setGroups={setSelectedGroups}
                urlTag={tournamentId}
                logo={tournamentLogo}
                name={tournamentName}
                color={tournamentGradient}
                edition={tournamentEdition}
                matchesFiltered={[]}
            />

            <div className="flex flex-row w-full flex-1 overflow-hidden">
                <div className="flex flex-col w-[55%] h-full gap-[20px] overflow-auto">
                    <EventMatchDisplay
                        onMatchUpdate={refreshPointsTable}
                        matches={[]}
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
