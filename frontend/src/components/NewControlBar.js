import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft, faShuffle } from "@fortawesome/free-solid-svg-icons";
import { customStyles } from "../utils/selectStyles";

function NewControlBar({
    refreshFunction,
    matchCount,
    teams,
    stadiums,
    stages,
    groups,
    setSelectedTeams,
    setSelectedStadiums,
    setSelectedGroups,
    setSelectedStages,
    urlTag,
    edition,
    logo,
    name,
    color,
    matchesFiltered,
    setGroups
}) {

    const [teamOptions, setTeamOptions] = useState([]);
    const [stadiumOptions, setStadiumOptions] = useState([]);
    const [groupOptions, setGroupOptions] = useState([]);
    const [stageOptions, setStageOptions] = useState([]);

    const fetchTeamOptions = async () => {

        // let url = urlTag === "wtc" ? `/${urlTag}/${edition}/teams` : `/leagues/${urlTag}/${edition}/teams`;
        let url = `/tournaments/${urlTag}/teams`;
        console.log(url);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTeamOptions(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchGroupOptions = async () => {
        let url = `/tournaments/${urlTag}/groups`;
        console.log(url);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setGroupOptions(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchVenueOptions = async () => {
        // let url = urlTag === "wtc" ? `/${urlTag}/${edition}/venues` : `/leagues/${urlTag}/${edition}/venues`;
        let url = `/tournaments/${urlTag}/venues`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setStadiumOptions(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchStageOptions = async () => {
        let url = `/tournaments/${urlTag}/stages`;
        console.log(url);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setStageOptions(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleTeamChange = (selectedOptions) => {
        setSelectedTeams(selectedOptions);
    };

    const handleVenueChange = (selectedOptions) => {
        setSelectedStadiums(selectedOptions);
    };

    const handleGroupChange = (selectedOptions) => {
        setSelectedGroups(selectedOptions);
    };

    const handleStageChange = (selectedOptions) => {
        setSelectedStages(selectedOptions);
    };


    const resetIncompleteMatches = async () => {
        // if (urlTag === "wtc") {
        //     matchNums = matchesFiltered.map(match => `${match.seriesID}.${match.matchNumber.charAt(0)}`).join("-");
        // } else {
        //     matchNums = matchesFiltered.map(match => match.MatchNumber).join("-")
        // }

        try {
            let matchNums = matchesFiltered.map(match => match.matchNumber)

            const params = new URLSearchParams();
            params.set("match_nums", matchNums);

            const response = await fetch(`/tournaments/${urlTag}/match/clear?${params.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                refreshFunction();
            } else {
                alert("Error: Response not ok")
            }
        } catch (error) {
            alert(error);
        }
    };

    const randomlySimIncompleteMatches = async () => {
        // let matchNums = "";

        // if (urlTag === "wtc") {
        //     matchNums = matchesFiltered.map(match => `${match.seriesID}.${match.matchNumber.charAt(0)}`).join("-");
        // } else {
        //     matchNums = matchesFiltered.map(match => match.MatchNumber).join("-")
        // }

        // try {

        //     let url = urlTag === "wtc" ? `/${urlTag}/${edition}` : `/leagues/${urlTag}/${edition}`;

        //     const response = await fetch(`${url}/sim/${matchNums}`,
        //         {
        //             method: 'PATCH',
        //             headers: {
        //                 'Content-Type': 'application/json'
        //             }
        //         });

        //     if (response.ok) {
        //         refreshFunction();
        //     } else {
        //         alert("Error: Response not ok")
        //     }
        // } catch (error) {
        //     alert(error)
        // }
        alert("Random simulation coming soon")
    };

    useEffect(() => {
        fetchTeamOptions();
        fetchVenueOptions();
        fetchGroupOptions();
        fetchStageOptions();
        // eslint-disable-next-line
    }, [urlTag]);


    return (
        <div className="flex h-[8%] m-2 rounded-3xl" style={{ background: color }}>
            <div className="flex items-center justify-center w-[15%]">
                <img className="w-[90%] h-[80%] object-contain" src={logo} alt={`${name} Logo`}></img>
            </div>

            <div className="flex justify-center items-center w-[10%] font-['Reem_Kufi_Fun'] uppercase text-white">
                {matchCount + " MATCHES"}
            </div>

            <div className="flex justify-center items-center w-[57%]">
                <div className="p-[5px] font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] w-[25%] flex items-center min-w-0">
                    <Select
                        isMulti
                        borderRadius="10px"
                        menuPosition="fixed"
                        options={stageOptions}
                        styles={customStyles}
                        value={stages}
                        onChange={handleStageChange}
                        placeholder="Stages"
                        noOptionsMessage={({ inputValue }) => `No result found for "${inputValue}"`}
                    />
                </div>
                <div className="p-[5px] font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] w-[20%] flex items-center min-w-0">
                    <Select
                        isMulti
                        borderRadius="10px"
                        menuPosition="fixed"
                        options={groupOptions}
                        styles={customStyles}
                        value={groups}
                        onChange={handleGroupChange}
                        placeholder="Groups"
                        noOptionsMessage={({ inputValue }) => `No result found for "${inputValue}"`}
                    />
                </div>
                <div className="p-[5px] font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] flex-1 flex items-center min-w-0">
                    <Select
                        isMulti
                        menuPosition="fixed"
                        options={teamOptions}
                        styles={customStyles}
                        value={teams}
                        onChange={handleTeamChange}
                        placeholder="Teams"
                        noOptionsMessage={({ inputValue }) => `No result found for "${inputValue}"`}
                    />
                </div>
                <div className="p-[5px] font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] flex-1 flex items-center min-w-0">
                    <Select
                        isMulti
                        borderRadius="10px"
                        menuPosition="fixed"
                        options={stadiumOptions}
                        styles={customStyles}
                        value={stadiums}
                        onChange={handleVenueChange}
                        placeholder="Venues"
                        noOptionsMessage={({ inputValue }) => `No result found for "${inputValue}"`}
                    />
                </div>
            </div>

            <div className="w-[18%] flex justify-center">
                <button
                    className="flex-1 font-['Nunito_Sans'] text-[1vw] border border-transparent rounded-[10px] m-[15px] bg-transparent text-white transition-all duration-200 hover:text-white hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.1)_100%)] hover:backdrop-blur-[4px] hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] active:scale-90"
                    onClick={resetIncompleteMatches}
                >
                    <FontAwesomeIcon icon={faArrowRotateLeft} size="lg" />
                </button>
                <button
                    className="flex-1 font-['Nunito_Sans'] text-[1vw] border border-transparent rounded-[10px] m-[15px] bg-transparent text-white transition-all duration-200 hover:text-white hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.1)_100%)] hover:backdrop-blur-[4px] hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] active:scale-90"
                    onClick={randomlySimIncompleteMatches}
                >
                    <FontAwesomeIcon icon={faShuffle} size="lg" />
                </button>
            </div>
        </div >
    );
}

export default NewControlBar;