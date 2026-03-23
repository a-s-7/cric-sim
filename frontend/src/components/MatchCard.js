import React, { useState, useEffect } from "react";

function MatchCard({
    homeGradient,
    awayGradient,
    homeTeamName,
    homeTeamLogo,
    awayTeamName,
    awayTeamLogo,
    tournamentName,
    tournamentID,
    tournamentEdition,
    matchNum,
    venue,
    date,
    matchResult,
    onMatchUpdate,
    homeTeamRuns,
    homeTeamOvers,
    awayTeamRuns,
    awayTeamOvers,
    awayTeamWickets,
    homeTeamWickets,
    neutralGradient,
    group,
    stage,
    tossResult,
    tossDecision
}) {
    const [selected, setSelected] = useState(matchResult);
    const [hoveredSection, setHoveredSection] = useState(null);

    const [awayRuns, setAwayRuns] = useState(awayTeamRuns);
    const [awayWickets, setAwayWickets] = useState(awayTeamWickets);
    const [awayOvers, setAwayOvers] = useState(awayTeamOvers);

    const [homeRuns, setHomeRuns] = useState(homeTeamRuns);
    const [homeWickets, setHomeWickets] = useState(homeTeamWickets);
    const [homeOvers, setHomeOvers] = useState(homeTeamOvers);

    const [battingFirstToggle, setBattingFirstToggle] = useState(tossDecision === "bat");
    const [tossResultState, setTossResultState] = useState(tossResult);

    useEffect(() => {
        setSelected(matchResult);
        setAwayRuns(awayTeamRuns);
        setAwayWickets(awayTeamWickets);
        setAwayOvers(awayTeamOvers);
        setHomeRuns(homeTeamRuns);
        setHomeWickets(homeTeamWickets);
        setHomeOvers(homeTeamOvers);
    }, [matchResult, awayTeamRuns, awayTeamWickets, awayTeamOvers, homeTeamRuns, homeTeamWickets, homeTeamOvers]);

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
        const gradients = [homeGradient, neutralGradient, awayGradient];
        const isSelected = selected === section && section !== "None";
        const isHovered = hoveredSection === section;
        const isLoser = selected !== 'None' && selected !== 'No-result' && !isSelected && section !== 'No-result' && section !== 'None';

        const background = isSelected ? gradients[num] : 'transparent';
        const color = isSelected ? 'white' : (isLoser ? '#959595' : 'black');

        return {
            background: isHovered ? 'whitesmoke' : background,
            color: isHovered ? 'black' : color,
            transition: 'all 0.3s ease'
        };
    };

    const handleClick = async (result) => {
        setSelected(result);
        try {
            const response = await fetch(`/tournaments/${tournamentID}/match/${matchNum}/${result}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                onMatchUpdate();
            } else {
                alert("Error: Response not ok");
            }

        } catch (error) {
            alert(error);
        }
    };

    // ---------- Pure value-computation helpers ----------

    const computeRunValue = (val) => {
        let value = parseFloat(val);
        const [intPart, decPart] = value.toString().split('.').map(Number);
        if (decPart) value = intPart + 1.0;
        return value;
    };

    const computeOverValue = (val) => {
        if (val === '' || val === null || val === undefined) return '';

        let value = parseFloat(val);
        if (isNaN(value)) return '';

        if (value > 20) value = 20;

        value = parseFloat(value.toFixed(1));
        const parts = value.toString().split('.');
        const intPart = Number(parts[0]);
        const decPart = Number(parts[1] ?? 0);

        const overBallLimit = tournamentName === "THU" ? 4 : 5;

        if (decPart > overBallLimit) {
            value = intPart + 1.0;
        }

        return value;
    };

    const computeWicketValue = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        let value = parseFloat(val);
        if (isNaN(value)) return '';
        if (value > 10) value = 10;
        return value;
    };

    const validateAndParseScores = (overrides, currentValues) => {
        const { homeRuns, awayRuns, homeOvers, awayOvers, homeWickets, awayWickets } = currentValues;

        const getValue = (overrideVal, stateVal) => {
            const raw = overrideVal ?? stateVal;
            if (raw === '' || raw === null || raw === undefined) return null;
            const parsed = parseFloat(raw);
            return isNaN(parsed) ? null : parsed;
        };

        const homeRunsValue = getValue(overrides.homeRuns, homeRuns);
        const awayRunsValue = getValue(overrides.awayRuns, awayRuns);
        const homeOversValue = getValue(overrides.homeOvers, homeOvers);
        const awayOversValue = getValue(overrides.awayOvers, awayOvers);
        const homeWicketsValue = getValue(overrides.homeWickets, homeWickets);
        const awayWicketsValue = getValue(overrides.awayWickets, awayWickets);

        const allValid =
            homeRunsValue != null && homeRunsValue >= 0 &&
            awayRunsValue != null && awayRunsValue >= 0 &&
            homeWicketsValue != null && homeWicketsValue >= 0 &&
            awayWicketsValue != null && awayWicketsValue >= 0 &&
            homeOversValue != null && homeOversValue > 0 &&
            awayOversValue != null && awayOversValue > 0;

        if (!allValid) return null;

        return {
            homeRunsValue,
            awayRunsValue,
            homeOversValue,
            awayOversValue,
            homeWicketsValue,
            awayWicketsValue
        };
    };

    const handleNRRChange = async (overrides = {}) => {
        const parsedScores = validateAndParseScores(overrides, {
            homeRuns, awayRuns, homeOvers, awayOvers, homeWickets, awayWickets
        });

        if (!parsedScores) return;

        const {
            homeRunsValue,
            awayRunsValue,
            homeOversValue,
            awayOversValue,
            homeWicketsValue,
            awayWicketsValue
        } = parsedScores;

        try {
            const scoreKey = `${homeRunsValue}/${homeWicketsValue}/${homeOversValue}/${awayRunsValue}/${awayWicketsValue}/${awayOversValue}`;

            const response = await fetch(
                `/tournaments/${tournamentID}/match/score/${matchNum}/${scoreKey}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.ok) {
                onMatchUpdate();
            } else {
                alert("Error: Response not ok");
            }
        } catch (error) {
            alert(error);
        }
    };

    const resetMatchData = async () => {
        try {
            const params = new URLSearchParams();
            params.set("match_nums", [matchNum]);

            const response = await fetch(`/tournaments/${tournamentID}/match/clear?mode=match-numbers&${params.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                onMatchUpdate();
            } else {
                alert("Error: Response not ok");
            }
        } catch (error) {
            alert(error);
        }
    };

    const resetMatch = async (result) => {
        setHomeRuns('');
        setHomeWickets('');
        setHomeOvers('');
        setAwayRuns('');
        setAwayWickets('');
        setAwayOvers('');
        await resetMatchData();
        setSelected(result);
        onMatchUpdate();
    };

    const handleTossResultChange = async (result) => {
        setTossResultState(result);

        try {
            const response = await fetch(
                `/tournaments/${tournamentID}/match/toss-result/${matchNum}/${result}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (!response.ok) {
                alert("Error: Response not ok");
            }
        } catch (error) {
            alert(error);
        }
    };

    const handleTossDecisionChange = async (battingFirst) => {
        setBattingFirstToggle(battingFirst);

        try {
            const response = await fetch(
                `/tournaments/${tournamentID}/match/toss-decision/${matchNum}/${battingFirst ? 'bat' : 'bowl'}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (!response.ok) {
                alert("Error: Response not ok");
            }
        } catch (error) {
            alert(error);
        }
    };

    const getWinningMargin = () => {
        const parsedScores = validateAndParseScores({}, {
            homeRuns, awayRuns, homeOvers, awayOvers, homeWickets, awayWickets
        });

        if (!parsedScores) {
            return selected === "Home-win" ? `${homeTeamName} won` : `${awayTeamName} won`;
        }

        const {
            homeRunsValue,
            awayRunsValue,
            homeOversValue,
            awayOversValue,
            homeWicketsValue,
            awayWicketsValue
        } = parsedScores;

        const scores = {
            "Home": {
                runs: homeRunsValue,
                wickets: homeWicketsValue,
                overs: homeOversValue,
                name: homeTeamName
            }, "Away": {
                runs: awayRunsValue,
                wickets: awayWicketsValue,
                overs: awayOversValue,
                name: awayTeamName
            }
        }

        const homeBattedFirst = (tossResultState === 'Home-win' && battingFirstToggle) ||
            (tossResultState === 'Away-win' && !battingFirstToggle);

        const teamBattingFirst = homeBattedFirst ? "Home" : "Away";
        const teamBattingSecond = homeBattedFirst ? "Away" : "Home";

        if (scores[teamBattingSecond].runs > scores[teamBattingFirst].runs) {
            return `${scores[teamBattingSecond].name} won by ${10 - scores[teamBattingSecond].wickets} ${10 - scores[teamBattingSecond].wickets === 1 ? 'wicket' : 'wickets'}`;
        } else if (scores[teamBattingSecond].runs < scores[teamBattingFirst].runs) {
            return `${scores[teamBattingFirst].name} won by ${scores[teamBattingFirst].runs - scores[teamBattingSecond].runs} ${scores[teamBattingFirst].runs - scores[teamBattingSecond].runs === 1 ? 'run' : 'runs'}`;
        } else {
            return `${selected === "Home-win" ? scores[teamBattingFirst].name : scores[teamBattingSecond].name} won the Super Over`;
        }

    }

    const getMatchResult = () => {
        if (selected === 'None') {
            return '';
        } else if (selected === "No-result") {
            return 'No Result';
        } else {
            return getWinningMargin()
        }
    }

    const getTossSpan = (type, section, isTossWinner) => {
        const isColored = selected === section && hoveredSection !== section;
        const roleSrc = type === 'bat'
            ? "https://static.thenounproject.com/png/2005489-200.png"
            : "https://static.thenounproject.com/png/2485180-200.png";

        if (!isTossWinner) return null;

        // Using solid neutral grey and white ring
        const baseColor = "bg-[#d1d5db]";
        const innerColor = "bg-[#d1d5db]";
        const ringGradient = section === 'Home-win' ? homeGradient : awayGradient;

        return (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    handleTossResultChange(tossResultState === 'Home-win' ? 'Away-win' : 'Home-win');
                }}
                className={`flex items-center justify-center rounded-full transition-colors duration-200 border-[0.5px] border-white/20 ${baseColor}`}
                style={{
                    width: "3.2vh",
                    height: "3.2vh",
                    cursor: "pointer",
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
            >
                {/* The Ring is now solid white */}
                <div className="flex items-center justify-center rounded-full w-[2.6vh] h-[2.6vh] bg-white shadow-sm">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTossDecisionChange(!battingFirstToggle);
                        }}
                        className={`flex items-center justify-center rounded-full transition-colors duration-200 ${innerColor}`}
                        style={{
                            width: "2.1vh",
                            height: "2.1vh",
                            cursor: "pointer",
                        }}
                    >
                        <img
                            src={roleSrc}
                            alt={type}
                            className="w-[1.3vh] h-[1.3vh] opacity-60"
                            style={{ filter: 'none' }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="shadow-lg rounded-[32px] border border-[#cec7c7] overflow-hidden flex w-auto">
            <div className="h-[170px] w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-[135px]">
                    <div className='flex flex-row w-[37.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        onClick={() => handleClick('Home-win')}
                        onMouseEnter={() => setHoveredSection("Home-win")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5">
                            {selected !== 'None' && <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded-[5px] text-left h-1/5 mb-[5px]">
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    step="1"
                                    onChange={(event) => {
                                        const newVal = computeRunValue(event.target.value);
                                        setHomeRuns(newVal);
                                        handleNRRChange({ homeRuns: newVal });
                                    }}
                                    value={homeRuns === 0 ? '' : (homeRuns ?? '')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }} />

                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="1"
                                    onChange={(event) => {
                                        const newVal = computeWicketValue(event.target.value);
                                        setHomeWickets(newVal);
                                        handleNRRChange({ homeWickets: newVal });
                                    }}
                                    value={homeWickets === 0 ? '' : (homeWickets ?? '')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }} />
                            </div>}
                            {selected !== 'None' && <div className="flex justify-end">
                                <input className="border-[0.5px] border-gray-300 text-[1.75vh] rounded-[5px] bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    onChange={(event) => {
                                        const newVal = computeOverValue(event.target.value);
                                        setHomeOvers(newVal);
                                        handleNRRChange({ homeOvers: newVal });
                                    }}
                                    value={homeOvers === 0 ? '' : (homeOvers ?? '')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }} />
                            </div>}

                        </div>

                        <div className="relative flex items-center justify-end text-[2.25vh] w-1/5 h-full">
                            {/* Centered name */}
                            <span>{homeTeamName}</span>

                            {/* Bottom-anchored element */}
                            {selected !== 'None' && <span className="absolute bottom-4 right-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Home-win', tossResultState === 'Home-win')}</span>
                            }
                        </div>

                        <div className="w-[36%] flex justify-center items-center p-[30px]">
                            <img className="box-content border border-zinc-200 w-full" src={homeTeamLogo} alt={`${homeTeamName} Logo`} />
                        </div>
                    </div>

                    <div className='flex flex-col border-l border-r border-gray-100 w-[25%] cursor-pointer'
                        onClick={() => handleClick('No-result')}
                        onMouseEnter={() => setHoveredSection("No-result")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("No-result", 1)}>
                        <div className={`w-full h-[30%] flex font-bold items-center justify-center text-[0.9vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedDate}</div>
                        <div className="w-full h-2/5 flex items-center justify-center">
                            <div className={`uppercase text-inherit text-center px-1 tracking-[0.02em] ${selected === 'None' ? 'text-[1.2vw] font-bold' : 'text-[0.95vw] font-black'}`}>
                                {selected === 'None' ? 'VS' : getMatchResult()}
                            </div>
                        </div>
                        <div className={`w-full h-[30%] flex items-center justify-center text-[0.75vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedTime} your time</div>

                    </div>

                    <div className='flex flex-row w-[37.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        onClick={() => handleClick('Away-win')}
                        onMouseEnter={() => setHoveredSection('Away-win')}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle('Away-win', 2)}>

                        <div className="w-[36%] flex justify-center items-center p-[30px]">
                            <img className="box-content border border-zinc-200 w-full" src={awayTeamLogo} alt={`${awayTeamName} Logo`} />
                        </div>

                        <div className="relative flex items-center justify-start text-[2.25vh] w-1/5 justify-start">
                            {/* Centered name */}
                            <span>{awayTeamName}</span>

                            {/* Bottom-anchored element */}

                            {selected !== 'None' && <span className="absolute bottom-4 left-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Away-win', tossResultState === 'Away-win')}</span>
                            }
                        </div>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5">
                            {selected !== 'None' && <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded-[5px] text-left h-1/5 mb-[5px]">
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    step="1"
                                    onChange={(event) => {
                                        const newVal = computeRunValue(event.target.value);
                                        setAwayRuns(newVal);
                                        handleNRRChange({ awayRuns: newVal });
                                    }}
                                    value={awayRuns === 0 ? '' : (awayRuns ?? '')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }} />
                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded-[5px] border-[0.5px] border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="1"
                                    onChange={(event) => {
                                        const newVal = computeWicketValue(event.target.value);
                                        setAwayWickets(newVal);
                                        handleNRRChange({ awayWickets: newVal });
                                    }}
                                    value={awayWickets === 0 ? '' : (awayWickets ?? '')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }} />
                            </div>}
                            {selected !== 'None' && <div className="flex justify-start">
                                <input className="border-[0.5px] border-gray-300 text-[1.75vh] rounded-[5px] bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    onChange={(event) => {
                                        const newVal = computeOverValue(event.target.value);
                                        setAwayOvers(newVal);
                                        handleNRRChange({ awayOvers: newVal });
                                    }}
                                    value={awayOvers === 0 ? '' : (awayOvers ?? '')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }} />
                            </div>}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 h-[35px] flex flex-row items-center justify-between bg-gray-300/20 text-[0.9vw]">
                    <div className="flex justify-center items-center h-full flex-grow text-black cursor-pointer"
                        onClick={() => resetMatch('None')}
                        onMouseEnter={() => setHoveredSection("None")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={{
                            background: hoveredSection === "None" ? 'rgba(0, 0, 0, 0.1)' : 'transparent'
                        }}>
                        {group ? `${stage} · Group ${group} · Match ${matchNum} · ${venue}` : `${stage} · Match ${matchNum} · ${venue}`}
                    </div>
                </div>
            </div>
        </div >
    );
}

export default MatchCard;