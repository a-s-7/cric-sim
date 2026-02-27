import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft, faLayerGroup, faShuffle, faSpinner, faThumbTack } from "@fortawesome/free-solid-svg-icons";
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
    const [isSimulating, setIsSimulating] = useState(false);
    const [isResetting, setIsResetting] = useState(false);


    const [stageValues, setStageValues] = useState([]);
    const [activeStageIndex, setActiveStageIndex] = React.useState(0);
    const [autoJumpToLatest, setAutoJumpToLatest] = useState(true);
    const [isClearAllMode, setIsClearAllMode] = useState(true);

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

    const fetchActiveStages = async (isInitialLoad = false) => {
        let url = `/tournaments/${urlTag}/stages?onlyActiveStages=true`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setStageValues(result);

            if (result.length > 0) {
                if (isInitialLoad || autoJumpToLatest) {
                    setActiveStageIndex(result.length - 1);
                } else {
                    setActiveStageIndex(prev => prev < result.length ? prev : result.length - 1);
                }
            } else {
                setActiveStageIndex(0);
            }
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
        setIsResetting(true);
        try {
            const params = new URLSearchParams();
            if (isClearAllMode) {
                params.set("mode", "all");
            } else {
                params.set("mode", "stage");
                params.set("stageOrder", stageValues[activeStageIndex].value);
            }

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
        } finally {
            setIsResetting(false);
        }
    };

    const randomlySimIncompleteMatches = async () => {
        setIsSimulating(true);
        try {
            const response = await fetch(`/tournaments/${urlTag}/match/simulate?stage_num=${stageValues[activeStageIndex].value}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

            if (response.ok) {
                refreshFunction();
            } else {
                alert("Error: Response not ok")
            }
        } catch (error) {
            alert(error)
        } finally {
            setIsSimulating(false);
        }
    };

    useEffect(() => {
        fetchTeamOptions();
        fetchVenueOptions();
        fetchGroupOptions();
        fetchStageOptions();
        fetchActiveStages(true);
        // eslint-disable-next-line
    }, [urlTag]);


    useEffect(() => {
        fetchActiveStages(false);
        // eslint-disable-next-line
    }, [matchesFiltered]);

    return (
        <div className="flex h-[8%] m-2 rounded-3xl" style={{ background: color }}>
            <div className="flex items-center justify-center w-[13%]">
                <img className="w-[90%] h-[80%] object-contain" src={logo} alt={`${name} Logo`}></img>
            </div>

            <div className="flex justify-center items-center w-[7%] font-['Reem_Kufi_Fun'] uppercase text-white">
                {matchCount + " MATCHES"}
            </div>

            <div className="flex justify-center items-center flex-1 pl-2 pr-2">
                <div className="p-1 font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] w-[20%] flex items-center min-w-0">
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
                <div className="p-1 font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] w-[15%] flex items-center min-w-0">
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
                <div className="p-1 font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] flex-1 flex items-center min-w-0">
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
                <div className="p-1 font-['Reem_Kufi_Fun'] uppercase text-[1.4vh] flex-1 flex items-center min-w-0">
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

            <div className="flex justify-end items-center gap-2 pl-2 pr-2">
                <div className="flex items-center rounded-[15px] bg-white/10 p-1">
                    <button
                        className={`w-[60px] h-[42px] font-['Nunito_Sans'] text-[1vw] border border-transparent rounded-[10px] bg-transparent text-white transition-all duration-200 hover:text-white hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.1)_100%)] hover:backdrop-blur-[4px] hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] active:scale-90 ${isResetting ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={resetIncompleteMatches}
                        disabled={isResetting}
                    >
                        <FontAwesomeIcon icon={isResetting ? faSpinner : faArrowRotateLeft} size="lg" className={isResetting ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => setIsClearAllMode(!isClearAllMode)}
                        className={`w-[36px] h-[42px] flex-shrink-0 flex items-center justify-center 
                                text-white text-[12px] rounded-[10px] transition-all ml-1
                                ${isClearAllMode ? 'bg-white/20 hover:bg-white/40' : 'bg-transparent hover:bg-white/15'}`}
                        title={isClearAllMode ? "Mode: Clear All Filtered" : "Mode: Clear Stage Only"}
                    >
                        <FontAwesomeIcon icon={faLayerGroup} />
                    </button>
                </div>

                <div className="flex items-center rounded-[15px] bg-white/10 p-1">
                    <button
                        className={`w-[60px] h-[42px] font-['Nunito_Sans'] text-[1vw] border border-transparent rounded-[10px] bg-transparent text-white transition-all duration-200 hover:text-white hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.1)_100%)] hover:backdrop-blur-[4px] hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] active:scale-90 ${isSimulating ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={randomlySimIncompleteMatches}
                        disabled={isSimulating}
                    >
                        <FontAwesomeIcon icon={isSimulating ? faSpinner : faShuffle} size="lg" className={isSimulating ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex items-center rounded-[15px] bg-white/10 p-1 pl-3 pr-1">
                    <div className="flex items-center justify-center gap-1 h-[42px]">
                        {/* Left Arrow */}
                        <button
                            onClick={() =>
                                stageValues.length > 0 && setActiveStageIndex((prev) =>
                                    prev === 0 ? stageValues.length - 1 : prev - 1
                                )
                            }
                            className="w-[28px] h-[28px] flex items-center justify-center 
                    text-white text-sm rounded-md
                    hover:bg-white/20 active:scale-90 transition-all"
                        >
                            ◀
                        </button>

                        {/* Stage Text */}
                        <h1 className="font-['Reem_Kufi_Fun'] uppercase text-[0.85vw] text-white 
                    w-[7.5vw] text-center leading-none">
                            {stageValues.length > 0 ? stageValues[activeStageIndex]?.label || "" : ""}
                        </h1>

                        {/* Right Arrow */}
                        <button
                            onClick={() =>
                                stageValues.length > 0 && setActiveStageIndex((prev) =>
                                    prev === stageValues.length - 1 ? 0 : prev + 1
                                )
                            }
                            className="w-[28px] h-[28px] flex items-center justify-center 
                    text-white text-sm rounded-md
                    hover:bg-white/20 active:scale-90 transition-all"
                        >
                            ▶
                        </button>

                        {/* Auto-jump Toggle */}
                        <button
                            onClick={() => setAutoJumpToLatest(!autoJumpToLatest)}
                            className={`ml-1 w-[36px] h-[42px] flex items-center justify-center 
                                    text-white text-[12px] rounded-[10px] transition-all
                                    ${autoJumpToLatest ? 'bg-white/5 hover:bg-white/15' : 'bg-white/20 hover:bg-white/40'}`}
                            title={autoJumpToLatest ? "Auto-jump to latest stage is ON" : "Auto-jump to latest stage is OFF"}
                        >
                            <FontAwesomeIcon icon={faThumbTack} className={autoJumpToLatest ? "rotate-45" : ""} />
                        </button>
                    </div>
                </div>
            </div>

        </div >
    );
}

export default NewControlBar;