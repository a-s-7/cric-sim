import React, { useEffect, useState } from "react";
import T20LeagueMatchCardPanel from "../components/T20League/T20LeagueMatchCardPanel";
import T20LeaguePointsTable from "../components/T20League/T20LeaguePointsTable";
import ControlBar from "../components/ControlBar";
import NewControlBar from "../components/NewControlBar";

function TournamentPage({ tournamentId, tournamentName, tournamentEdition, tournamentLogo, tournamentGradient, tournamentPointsTableColor }) {
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedStadiums, setSelectedStadiums] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);

    const MATCH_DATA_INDEX = 3;

    const [matchesData, setMatchesData] = useState([]);
    const [pointsTableData, setPointsTableData] = useState([]);

    const [matchAreaKey, setMatchAreaKey] = useState(0);

    const refreshPointsTable = async () => {
        // await fetchPointsTableData();
    }

    const refreshMatchArea = async () => {
        // await fetchMatchData();
        // setMatchAreaKey(matchAreaKey + 1);
    }

    const handleRefresh = async () => {
        // await refreshMatchArea();
        // await refreshPointsTable();
    }

    // const fetchMatchData = async () => {
    //     let teamVal = "All";
    //     let stadiumVal = "All";

    //     if (selectedTeams.length > 0) {
    //         teamVal = selectedTeams.map(team => team.value).join("-");
    //     }

    //     if (selectedStadiums.length > 0) {
    //         stadiumVal = selectedStadiums.map(stadium => stadium.value).join(",");
    //     }

    //     let url = `/leagues/${tournamentId}/${leagueEdition}/matches/${teamVal}/${stadiumVal}`;

    //     try {
    //         const response = await fetch(url);
    //         if (!response.ok) {
    //             throw new Error("Response was not ok");
    //         }
    //         const result = await response.json();
    //         setMatchesData(result);
    //     } catch (error) {
    //         console.error("Error fetching data:", error);
    //     }
    // };

    // const fetchPointsTableData = async () => {
    //     let url = `/leagues/${tournamentId}/${leagueEdition}/points_table`;

    //     try {
    //         const response = await fetch(url);
    //         if (!response.ok) {
    //             throw new Error("Response was not ok");
    //         }
    //         const result = await response.json();

    //         if (pointsTableData.length > 0) {
    //             const diffs = calculatePointsTableChanges(result);
    //             result.forEach(team => {
    //                 team["diff"] = diffs.get(team.acronym);
    //             });
    //         } else {
    //             result.forEach(team => {
    //                 team["diff"] = 0;
    //             });
    //         }
    //         setPointsTableData(result);
    //     } catch (error) {
    //         console.error("Error fetching data:", error);
    //     }
    // };

    // const calculatePointsTableChanges = (newData) => {
    //     const diffMap = new Map();

    //     pointsTableData.forEach((team, index) => {
    //         diffMap.set(team.acronym, index)
    //     })

    //     newData.forEach((team, index) => {
    //         diffMap.set(team.acronym, diffMap.get(team.acronym) - index)
    //     })

    //     return diffMap;
    // }

    useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line
    }, [selectedTeams, selectedStadiums]);

    const resetState = async () => {
        await setSelectedTeams([]);
        await setSelectedStadiums([]);
        await setMatchesData([]);
        await setPointsTableData([]);
    }

    useEffect(() => {
        resetState();
        handleRefresh();
        // eslint-disable-next-line
    }, [tournamentId]);


    return (
        <div className="T20LeaguePage">
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

            {/* <div className="matchArea" >
                <div className="matchCardContainer">
                    <T20LeagueMatchCardPanel key={matchAreaKey}
                        onMatchUpdate={refreshPointsTable}
                        matches={matchesData}
                        leagueUrlTag={leagueUrlTag}
                        leagueEdition={leagueEdition}
                        cardNeutralGradient={leagueGradient} />
                </div>
                <div className="tableContainer">
                    <div className="tableWrapper">
                        <T20LeaguePointsTable leagueID={leagueUrlTag}
                            pointsTableData={pointsTableData}
                            headerColor={leaguePointsTableColor} />
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default TournamentPage;