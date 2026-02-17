import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft, faShuffle } from "@fortawesome/free-solid-svg-icons";

function NewControlBar({
    refreshFunction, matchCount, teams, stadiums, setSelectedTeams, setSelectedStadiums, setSelectedGroups,
    urlTag, edition, logo, name, color, matchesFiltered, groups, setGroups
}) {

    const [teamOptions, setTeamOptions] = useState([]);
    const [stadiumOptions, setStadiumOptions] = useState([]);
    const [groupOptions, setGroupOptions] = useState([]);

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

    const handleTeamChange = (selectedOptions) => {
        setSelectedTeams(selectedOptions);
    };

    const handleVenueChange = (selectedOptions) => {
        setSelectedStadiums(selectedOptions);
    };

    const handleGroupChange = (selectedOptions) => {
        setSelectedGroups(selectedOptions);
    };


    const resetIncompleteMatches = async () => {
        // let matchNums = "";

        // if (urlTag === "wtc") {
        //     matchNums = matchesFiltered.map(match => `${match.seriesID}.${match.matchNumber.charAt(0)}`).join("-");
        // } else {
        //     matchNums = matchesFiltered.map(match => match.MatchNumber).join("-")
        // }

        // try {
        //     let url = urlTag === "wtc" ? `/${urlTag}/${edition}` : `/leagues/${urlTag}/${edition}`;

        //     const response = await fetch(`${url}/clear/${matchNums}`,
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
        alert("Reset coming soon")
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
        // eslint-disable-next-line
    }, [urlTag]);


    const customStyles = {
        container: (base) => ({
            ...base,
            width: '100%',
        }),
        control: (baseStyles, state) => ({
            ...baseStyles,
            border: 0,
            boxShadow: 'none',
            borderRadius: '10px',
            height: '3.5vh',
            minHeight: '3.5vh',
            maxWidth: '100%',
            overflow: 'hidden',
        }),
        valueContainer: (base) => ({
            ...base,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none', /* Firefox */
            '&::-webkit-scrollbar': {
                display: 'none', /* Chrome/Safari */
            },
        }),
        multiValue: (base) => ({
            ...base,
            flexShrink: 0,
        }),
        singleValue: (base) => ({
            ...base,
            width: '100%',
        }),
        placeholder: (base) => ({
            ...base,
            width: '100%',
        }),
        input: (base) => ({
            ...base,
            flexShrink: 0,
        })
    };

    return (
        <div className="flex h-[8%] m-2 rounded-3xl" style={{ background: color }}>
            <div className="flex items-center justify-center w-[15%]">
                <img className="w-[90%] h-[80%] object-contain" src={logo} alt={`${name} Logo`}></img>
            </div>
            <div className="flex justify-center items-center w-[10%] font-['Reem_Kufi_Fun'] uppercase text-white">
                {matchCount + " MATCHES"}
            </div>
            <div className="flex justify-center items-center w-[57%]">
                <div className="p-[5px] font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] w-[20%] flex items-center min-w-0">
                    <Select
                        isMulti
                        borderRadius="10px"
                        menuPosition="fixed"
                        options={groupOptions}
                        styles={customStyles}
                        value={groups}
                        onChange={handleGroupChange}
                        placeholder="Select groups"
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
                        placeholder="Select teams"
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
                        placeholder="Select venues"
                        noOptionsMessage={({ inputValue }) => `No result found for "${inputValue}"`}
                    />
                </div>
            </div>
            <div className="w-[18%] flex justify-center">
                <button
                    className="flex-1 font-['Nunito_Sans'] text-[1vw] border border-transparent rounded-[10px] m-[15px] bg-transparent text-white hover:bg-white hover:text-black hover:shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-all"
                    onClick={resetIncompleteMatches}
                >
                    <FontAwesomeIcon icon={faArrowRotateLeft} size="lg" />
                </button>
                <button
                    className="flex-1 font-['Nunito_Sans'] text-[1vw] border border-transparent rounded-[10px] m-[15px] bg-transparent text-white hover:bg-white hover:text-black hover:shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-all"
                    onClick={randomlySimIncompleteMatches}
                >
                    <FontAwesomeIcon icon={faShuffle} size="lg" />
                </button>
            </div>
        </div >
    );
}

export default NewControlBar;