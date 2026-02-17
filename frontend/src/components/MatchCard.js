import React, { useRef, useState } from "react";

function MatchCard({
    homeGradient,
    awayGradient,
    homeTeamName,
    homeTeamLogo,
    awayTeamName,
    awayTeamLogo,
    leagueName,
    leagueID,
    matchNum,
    venue,
    date,
    time,
    matchResult,
    onMatchUpdate,
    homeTeamRuns,
    homeTeamOvers,
    awayTeamRuns,
    awayTeamOvers,
    awayTeamWickets,
    homeTeamWickets,
    neutralGradient,
    leagueEdition,
    group,
    stage
}) {

    const [selected, setSelected] = useState(matchResult)
    const [hoveredSection, setHoveredSection] = useState(null);


    const [awayRuns, setAwayRuns] = useState(awayTeamRuns);
    const [awayWickets, setAwayWickets] = useState(awayTeamWickets);
    const [awayOvers, setAwayOvers] = useState(awayTeamOvers);

    const [homeRuns, setHomeRuns] = useState(homeTeamRuns);
    const [homeWickets, setHomeWickets] = useState(homeTeamWickets);
    const [homeOvers, setHomeOvers] = useState(homeTeamOvers);

    const homeRunsRef = useRef(homeTeamRuns);
    const awayRunsRef = useRef(awayTeamRuns);
    const homeOversRef = useRef(homeTeamOvers);
    const awayOversRef = useRef(awayTeamOvers);
    const homeWicketsRef = useRef(homeTeamWickets);
    const awayWicketsRef = useRef(homeWicketsRef);

    const formattedDateObj = new Date(date);
    const timeZone = "America/Los_Angeles";


    const formattedDate = formattedDateObj.toLocaleDateString("en-US", {
        timeZone: timeZone,
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const formattedTime = formattedDateObj.toLocaleTimeString("en-US", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    const getStyle = (section, num) => {
        let background = 'transparent';
        let color = 'black';

        const gradients = [homeGradient, neutralGradient, awayGradient];

        background = (selected === section && section !== "None") ? gradients[num] : 'transparent';
        color = (selected === section && section !== "None") ? 'white' : 'black';

        const isHovered = hoveredSection === section;

        return {
            background: isHovered ? 'whitesmoke' : background,
            color: isHovered ? 'black' : color
        };
    }

    const handleClick = async (result) => {
        setSelected(result);

        // try {
        //     const response = await fetch(`/leagues/${leagueUrlTag}/${leagueEdition}/match/${matchNum}/${result}`,
        //         {
        //             method: 'PATCH',
        //             headers: {
        //                 'Content-Type': 'application/json'
        //             }
        //         });

        //     if (response.ok) {
        //         onMatchUpdate();
        //     } else {
        //         alert("Error: Response not ok")
        //     }
        // } catch (error) {
        //     alert(error)
        // }
        // alert("Match result not implemented yet")
    }


    const handleOverChange = async (val, area) => {
        let value = parseFloat(val);

        if (value > 20) {
            value = 20;
        }

        value = parseFloat(value.toFixed(2));

        const [intPart, decPart] = value.toString().split('.').map(Number);

        let overBallLimit = 5;

        if (leagueName === "THU") {
            overBallLimit = 4;
        }

        if (decPart > overBallLimit) {
            value = intPart + 1.0;
        }

        if (area === 'home') {
            setHomeOvers(value);
        } else {
            setAwayOvers(value);
        }
    }


    const handleRunChange = async (val, area) => {
        let value = parseFloat(val);

        const [intPart, decPart] = value.toString().split('.').map(Number);

        if (decPart) {
            value = intPart + 1.0;
        }

        if (area === 'home') {
            setHomeRuns(value);
        } else {
            setAwayRuns(value);
        }
    }

    const handleWicketChange = async (val, area) => {
        let value = parseFloat(val);

        if (value > 10) {
            value = 10;
        }

        if (area === 'home') {
            setHomeWickets(value);
        } else {
            setAwayWickets(value);
        }
    }

    const handleNRRChange = async () => {
        // const homeRunsValue = parseFloat(homeRunsRef.current.value);
        // const awayRunsValue = parseFloat(awayRunsRef.current.value);
        // const homeOversValue = parseFloat(homeOversRef.current.value);
        // const awayOversValue = parseFloat(awayOversRef.current.value);
        // const homeWicketsValue = parseFloat(homeWicketsRef.current.value);
        // const awayWicketsValue = parseFloat(awayWicketsRef.current.value);

        // if (!isNaN(homeWicketsValue) && !isNaN(awayWicketsValue) && !isNaN(homeRunsValue) && !isNaN(awayRunsValue) && !isNaN(homeOversValue) && homeOversValue !== 0 && !isNaN(awayOversValue) && awayOversValue !== 0) {
        //     try {
        //         const baseUrl = `/leagues/${leagueUrlTag}/${leagueEdition}/nrr/`;
        //         const url = `${baseUrl}${matchNum}/${homeRunsValue}/${homeWicketsValue}/${homeOversValue}/${awayRunsValue}/${awayWicketsValue}/${awayOversValue}`;


        //         const response = await fetch(url,
        //             {
        //                 method: 'PATCH',
        //                 headers: {
        //                     'Content-Type': 'application/json'
        //                 }
        //             });

        //         if (response.ok) {
        //             onMatchUpdate();
        //         } else {
        //             alert("Error: Response not ok")
        //         }
        //     } catch (error) {
        //         alert(error)
        //     }
        // }
        alert("NRR calculation not implemented yet")
    }

    const resetMatchData = async () => {
        // try {
        //     const response = await fetch(`/leagues/${leagueUrlTag}/${leagueEdition}/clear/${matchNum}`,
        //         {
        //             method: 'PATCH',
        //             headers: {
        //                 'Content-Type': 'application/json'
        //             }
        //         });

        //     if (response.ok) {
        //         //
        //     } else {
        //         alert("Error: Response not ok")
        //     }
        // } catch (error) {
        //     alert(error)
        // }
        alert("Reset match data not implemented yet")
    };

    const resetMatch = async (result) => {
        setHomeRuns('');
        setHomeWickets('');
        setHomeOvers('');

        setAwayRuns('');
        setAwayWickets('');
        setAwayOvers('');

        await resetMatchData();
        await handleClick(result);
    }

    return (
        <div className="shadow-md rounded-[32px] border border-[#cec7c7] overflow-hidden flex w-auto">
            <div className="h-[170px] w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-[135px]">
                    <div className='flex flex-row w-2/5 font-["Reem_Kufi_Fun"] uppercase'
                        onClick={() => handleClick('Home-win')}
                        onMouseEnter={() => setHoveredSection("Home-win")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5">
                            <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded-[5px] text-left h-1/5 mb-[5px]">
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent w-[35%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    step="1"
                                    ref={homeRunsRef}
                                    onChange={async (event) => {
                                        await handleRunChange(event.target.value, 'home')
                                        handleNRRChange()
                                    }}
                                    value={homeRuns ? homeRuns : ''}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: hoveredSection === "Home-win" || selected !== "Home-win" ? "black" : "white" }} />

                                <h2>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent text-[2.5vh] w-1/5 h-full ml-[2px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    max="10"
                                    step="1"
                                    ref={homeWicketsRef}
                                    onChange={(event) =>
                                        handleWicketChange(event.target.value, 'home')}
                                    value={homeWickets ? homeWickets : ''}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: hoveredSection === "Home-win" || selected !== "Home-win" ? "black" : "white" }} />

                            </div>
                            <div className="flex justify-end">
                                <input className="border-[0.5px] border-gray-300 text-[1.75vh] rounded-[5px] bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    ref={homeOversRef}
                                    onChange={async (event) => {
                                        await handleOverChange(event.target.value, 'home')
                                        handleNRRChange()
                                    }}
                                    value={homeOvers ? homeOvers : ''}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: hoveredSection === "Home-win" || selected !== "Home-win" ? "black" : "white" }} />

                            </div>
                        </div>


                        <div className="flex items-center text-[2vh] w-1/5 justify-end">
                            {homeTeamName}
                        </div>

                        <div className="w-[36%] flex justify-center items-center p-[30px]">
                            <img className="box-content border border-zinc-200 w-full" src={homeTeamLogo} alt={`${homeTeamName} Logo`}></img>
                        </div>

                    </div>
                    <div className='flex flex-col border-l border-r border-gray-100 w-1/5'
                        onClick={() => handleClick('No-result')}
                        onMouseEnter={() => setHoveredSection("No-result")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("No-result", 1)}>
                        <div className="w-full h-[30%] flex font-bold items-center justify-center text-[0.9vw]">{formattedDate}</div>
                        <div className="w-full h-2/5 flex items-center justify-center text-[1.2vw] font-bold">VS</div>
                        <div className="w-full h-[30%] flex items-center justify-center text-[0.75vw]">{formattedTime} your time</div>
                    </div>
                    <div className='flex flex-row w-2/5 font-["Reem_Kufi_Fun"] uppercase'
                        onClick={() => handleClick('Away-win')}
                        onMouseEnter={() => setHoveredSection('Away-win')}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle('Away-win', 2)}>

                        <div className="w-[36%] flex justify-center items-center p-[30px]">
                            <img className="box-content border border-zinc-200 w-full" src={awayTeamLogo} alt={`${awayTeamName} Logo`}></img>
                        </div>

                        <div className="flex items-center text-[2vh] w-1/5 justify-start">
                            {awayTeamName}
                        </div>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5">
                            <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded-[5px] text-left h-1/5 mb-[5px]">
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent w-[35%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    step="1"
                                    ref={awayRunsRef}
                                    onChange={async (event) => {
                                        await handleRunChange(event.target.value, 'away')
                                        handleNRRChange()
                                    }}
                                    value={awayRuns ? awayRuns : ''}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: hoveredSection === "Away-win" || selected !== "Away-win" ? "black" : "white" }} />
                                <h2>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent text-[2.5vh] w-1/5 h-full ml-[2px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    max="10"
                                    step="1"
                                    ref={awayWicketsRef}
                                    onChange={(event) =>
                                        handleWicketChange(event.target.value, 'away')}
                                    value={awayWickets ? awayWickets : ''}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: hoveredSection === "Away-win" || selected !== "Away-win" ? "black" : "white" }} />
                            </div>
                            <div className="flex justify-start">
                                <input className="border-[0.5px] border-gray-300 text-[1.75vh] rounded-[5px] bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    ref={awayOversRef}
                                    onChange={async (event) => {
                                        await handleOverChange(event.target.value, 'away');
                                        handleNRRChange();
                                    }}
                                    value={awayOvers ? awayOvers : ''}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: hoveredSection === "Away-win" || selected !== "Away-win" ? "black" : "white" }} />
                            </div>
                        </div>

                    </div>
                </div>
                <div className="border-t border-gray-100 h-[35px] flex flex-row items-center justify-between bg-white text-[0.9vw]">
                    <div className="flex justify-center items-center h-full flex-grow text-black"
                        onClick={() => resetMatch('None')}
                        onMouseEnter={() => setHoveredSection("None")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={{
                            background: hoveredSection === "None" ? 'rgba(0, 0, 0, 0.1)' : 'transparent'
                        }}>
                        {`${stage} - Match ${matchNum} · Group ${group} ·  ${venue}`}
                    </div>

                </div>
            </div>
        </div>
    )
        ;
}

export default MatchCard;