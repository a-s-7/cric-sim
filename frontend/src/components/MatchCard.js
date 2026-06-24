import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faCircleNotch, faUnlock, faBolt, faTriangleExclamation, faClock } from "@fortawesome/free-solid-svg-icons";

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
    tossDecision,
    city,
    format,
    category,
    homeMaxOversValue,
    awayMaxOversValue
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

    const [matchTimeChange, setMatchTimeChange] = useState(homeMaxOversValue !== 20 || awayMaxOversValue !== 20);

    const [homeMaxOvers, setHomeMaxOvers] = useState(homeMaxOversValue);
    const [awayMaxOvers, setAwayMaxOvers] = useState(awayMaxOversValue);

    const [isFetching, setIsFetching] = useState(false);
    const [showRateLimit, setShowRateLimit] = useState(false);
    const rateLimitTimer = useRef(null);
    const [showGenericError, setShowGenericError] = useState(false);
    const genericErrorTimer = useRef(null);

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
        weekday: "short",
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
    }).replace("AM", "a.m.").replace("PM", "p.m.");

    const getStyle = (section, num) => {
        const gradients = [homeGradient, neutralGradient, awayGradient];
        const isSelected = selected === section && section !== "None";
        const isHovered = hoveredSection === section;
        const isLoser = selected !== 'None' && selected !== 'No-result' && !isSelected && section !== 'No-result' && section !== 'None';

        const background = isHovered ? 'rgba(0, 0, 0, 0.05)' : (isSelected ? gradients[num] : 'transparent');
        const color = isHovered ? 'black' : (isSelected ? 'white' : (isLoser ? '#959595' : 'black'));

        return {
            background: background,
            color: color
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

        const maxOvers = format === "T20" ? 20 : 50;
        if (value > maxOvers) value = maxOvers;

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
        setSelected(result);
        setHomeRuns('');
        setHomeWickets('');
        setHomeOvers('');
        setAwayRuns('');
        setAwayWickets('');
        setAwayOvers('');
        setHomeMaxOvers(format === "T20" ? 20 : 50);
        setAwayMaxOvers(format === "T20" ? 20 : 50);
        await resetMatchData();
        onMatchUpdate();
    };

    const triggerGenericError = () => {
        if (genericErrorTimer.current) clearTimeout(genericErrorTimer.current);
        setShowGenericError(true);
        genericErrorTimer.current = setTimeout(() => setShowGenericError(false), 10000);
    };

    const handleFetchUpdate = async (e) => {
        e.stopPropagation();
        setIsFetching(true);
        try {
            const response = await fetch(`/run-match-update?tournament_id=${tournamentID}&match_num=${matchNum}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                onMatchUpdate();
            } else if (response.status === 429) {
                if (rateLimitTimer.current) clearTimeout(rateLimitTimer.current);
                setShowRateLimit(true);
                rateLimitTimer.current = setTimeout(() => setShowRateLimit(false), 10000);
            } else {
                triggerGenericError();
            }
        } catch (error) {
            triggerGenericError();
        }
        setIsFetching(false);
    };

    const handleMatchLock = async (e) => {
        e.stopPropagation(); // Prevents setting the match to "No-result" on click

        try {
            const response = await fetch(
                `/tournaments/${tournamentID}/match/status/${matchNum}/${'complete'}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (response.ok) {
                onMatchUpdate();
            } else {
                alert("Failed to update match status.");
            }
        } catch (error) {
            alert("Error updating match status: " + error.message);
        }
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
                maxOvers: homeMaxOvers,
                name: homeTeamName
            }, "Away": {
                runs: awayRunsValue,
                wickets: awayWicketsValue,
                overs: awayOversValue,
                maxOvers: awayMaxOvers,
                name: awayTeamName
            }
        }

        const homeBattedFirst = (tossResultState === 'Home-win' && battingFirstToggle) ||
            (tossResultState === 'Away-win' && !battingFirstToggle);

        const teamBattingFirst = homeBattedFirst ? "Home" : "Away";
        const teamBattingSecond = homeBattedFirst ? "Away" : "Home";

        if (scores[teamBattingSecond].runs > scores[teamBattingFirst].runs) {
            const wicketsRemaining = 10 - scores[teamBattingSecond].wickets;

            const [overs, balls = 0] = scores[teamBattingSecond].overs.toString().split('.');
            const ballsPlayed = parseInt(balls) + (parseInt(overs) * 6);

            const maxOversVal = scores[teamBattingSecond].maxOvers;
            const [maxO, maxB = 0] = maxOversVal.toString().split('.');
            const maxBalls = parseInt(maxB) + (parseInt(maxO) * 6);

            const ballsLeft = maxBalls - ballsPlayed;

            return `${scores[teamBattingSecond].name} won by ${wicketsRemaining} ${wicketsRemaining === 1 ? 'wicket' : 'wickets'}\n(${ballsLeft} ${ballsLeft === 1 ? 'ball' : 'balls'} left)`;
        } else if (scores[teamBattingSecond].runs < scores[teamBattingFirst].runs) {
            const runsMargin = scores[teamBattingFirst].runs - scores[teamBattingSecond].runs;

            return `${scores[teamBattingFirst].name} won by ${runsMargin} ${runsMargin === 1 ? 'run' : 'runs'}`;
        } else {
            return `${matchResult === "Home-win" ? scores["Home"].name : scores["Away"].name} won the Super Over`;
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
        const roleSrc = type === 'bat'
            ? "https://static.thenounproject.com/png/2005489-200.png"
            : "https://static.thenounproject.com/png/2485180-200.png";

        const isLoser = selected !== 'None' && selected !== 'No-result' && selected !== section;

        // Using solid neutral grey and white ring
        const baseColor = "bg-[#d1d5db]";
        const innerColor = "bg-[#d1d5db]";

        return (
            <div
                onClick={(e) => {
                    if (!isTossWinner) return;
                    e.stopPropagation();
                    handleTossResultChange(tossResultState === 'Home-win' ? 'Away-win' : 'Home-win');
                }}
                className={`flex items-center justify-center rounded-full transition-all duration-500 ease-in-out border border-white/20 hover:border-gray-300 ${baseColor} group/coin hover:bg-white has-[.inner-toss:hover]:bg-[#d1d5db]`}
                style={{
                    width: "3vh",
                    height: "3vh",
                    cursor: isTossWinner ? "pointer" : "default",
                    boxShadow: isTossWinner && !isLoser ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    opacity: isTossWinner ? (isLoser ? 0.4 : 1) : 0,
                    transform: isTossWinner ? 'scale(1)' : 'scale(0.4)',
                    pointerEvents: isTossWinner ? 'auto' : 'none'
                }}
            >
                {/* The Ring is now solid white */}
                <div className="flex items-center justify-center rounded-full w-[2.6vh] h-[2.6vh] bg-white shadow-sm transition-colors duration-200 group-hover/coin:bg-gray-700 has-[.inner-toss:hover]:bg-white">
                    <div
                        onClick={(e) => {
                            if (!isTossWinner) return;
                            e.stopPropagation();
                            handleTossDecisionChange(!battingFirstToggle);
                        }}
                        className={`inner-toss group/inner-hover flex items-center justify-center rounded-full transition-colors duration-200 ${innerColor} hover:bg-gray-700`}
                        style={{
                            width: "2vh",
                            height: "2vh",
                            cursor: "pointer",
                        }}
                    >
                        <img
                            src={roleSrc}
                            alt={type}
                            className="w-[1.4vh] h-[1.4vh] opacity-60 transition-all duration-200 group-hover/inner-hover:invert group-hover/inner-hover:opacity-100 filter-none"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const handleMatchTime = (e) => {
        e.stopPropagation();
        setMatchTimeChange(!matchTimeChange);
    };

    const handleMaxBallsChange = async (team, max_overs) => {
        if (max_overs === '' || max_overs === null) {
            return;
        }
        const params = new URLSearchParams();
        params.set("team", team);
        params.set("max_overs", max_overs);

        try {
            const response = await fetch(
                `/tournaments/${tournamentID}/match/max-balls/${matchNum}?${params}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (!response.ok) {
                alert("Error: Response not ok");
            }
            onMatchUpdate();
        } catch (error) {
            alert(error);
        }
    };

    const goldGlow = "border border-[#D4AF37] shadow-[0_0_1.25rem_rgba(212,175,55,0.8)]";
    const silverGlow = "border border-[#BFC1C2] shadow-[0_0_1.25rem_rgba(191,193,194,0.9)]";

    const getBorderClass = () => {
        if (!stage) return "border-[#cec7c7]";
        if (stage === "Final") return goldGlow;
        if (stage.includes("Semi-final")) return silverGlow;
        return "border-[#cec7c7]";
    };

    return (
        <div className={`shadow-lg rounded-[36px] border ${getBorderClass()} overflow-hidden flex`}>
            <div className="h-42 w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-34">
                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        onClick={() => handleClick('Home-win')}
                        onMouseEnter={() => setHoveredSection("Home-win")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5">
                            {selected !== 'None' && <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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


                            {selected !== 'None' && <div className="flex flex-row items-center justify-end w-full">
                                {matchTimeChange && (
                                    <div className="flex flex-row items-center ml-1 text-[1.75vh] shrink-0">
                                        <span className="mr-0.5">(</span>
                                        <input className="border border-gray-300 rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[3ch] h-[2.2vh] py-0 outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
                                            type="number"
                                            min="0.0"
                                            max={format === "T20" ? 20.0 : 50.0}
                                            step="0.1"
                                            value={homeMaxOvers}
                                            onChange={async (event) => {
                                                let newVal = computeOverValue(event.target.value);
                                                setHomeMaxOvers(newVal);
                                                await handleMaxBallsChange("home", newVal);
                                                if (homeOvers && newVal && homeOvers > newVal) {
                                                    setHomeOvers(newVal);
                                                    handleNRRChange({ homeOvers: newVal });
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ color: 'inherit' }} />
                                        <span className="ml-0.5">)</span>
                                    </div>
                                )}
                                <div className="flex justify-end ml-1 shrink-0">
                                    <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[4.5ch] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
                                        type="number"
                                        min="0.0"
                                        max={homeMaxOvers ?? (format === "T20" ? 20.0 : 50.0)}
                                        step="0.1"
                                        onChange={(event) => {
                                            let newVal = computeOverValue(event.target.value);
                                            if (homeMaxOvers && newVal > homeMaxOvers) {
                                                newVal = homeMaxOvers;
                                            }
                                            setHomeOvers(newVal);
                                            handleNRRChange({ homeOvers: newVal });
                                        }}
                                        value={homeOvers === 0 ? '' : (homeOvers ?? '')}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ color: 'inherit' }} />
                                </div>
                            </div>
                            }

                        </div>

                        <div className="relative flex items-center justify-end text-[2.25vh] w-1/5 h-full">
                            <span>{homeTeamName}</span>

                            {selected !== 'None' && <span className="absolute bottom-3 right-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Home-win', tossResultState === 'Home-win')}</span>
                            }
                        </div>

                        <div className={`w-2/5 h-full flex justify-center items-center ${category === "franchise" ? "p-4" : "p-6"}`}>
                            <img className={`box-content max-w-full max-h-full object-contain ${category === "franchise" ? "" : "border border-zinc-200"}`} src={homeTeamLogo} alt={`${homeTeamName} Logo`} />
                        </div>
                    </div>

                    <div className='flex flex-col border-l border-r border-gray-100 w-[27%] cursor-pointer'
                        onClick={() => handleClick('No-result')}
                        onMouseEnter={() => setHoveredSection("No-result")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("No-result", 1)}>
                        <div className={`w-full h-[31%] flex font-bold items-center justify-center text-[0.9vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedDate}</div>
                        <div className="w-full h-[38%] flex items-center justify-center">
                            <div className={`uppercase text-inherit text-center px-2 ${selected === 'None' ? 'text-[1.3vw] font-["Reem_Kufi_Fun"] font-medium tracking-wide opacity-80' : 'text-[0.8vw] font-["Reem_Kufi_Fun"] font-bold tracking-wider leading-snug drop-shadow-sm'}`} style={{ WebkitTextStroke: selected !== 'None' ? '0.5px currentColor' : '0' }}>
                                {selected === 'None' ? 'VS' : getMatchResult().split('\n').map((line, i) => (
                                    <div key={i} className={i !== 0 ? "text-gray-600" : ""} style={{ fontSize: i === 0 ? '0.9vw' : '0.75vw' }}>{line}</div>
                                ))}
                            </div>
                        </div>
                        <div className={`w-full h-[31%] flex flex-col items-center justify-end text-[0.75vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>
                            <div>
                                <span>{formattedTime}</span>
                            </div>
                            <div className='w-full flex justify-center items-center py-1 min-h-[1.8vh]'>
                                {formattedDateObj < new Date() && (tournamentID.slice(-2) === 'rw') && (
                                    <div className="relative flex items-center justify-center w-[1.8vh] h-[1.8vh]">

                                        {/* Rate-limit icon (red bolt) — quota exhausted */}
                                        <button
                                            className="absolute inset-0 flex items-center justify-center rounded-full bg-red-500 border border-red-400 shadow-sm"
                                            title="Gemini quota exhausted — please wait"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                opacity: showRateLimit ? 1 : 0,
                                                transform: showRateLimit ? 'scale(1)' : 'scale(0.5)',
                                                transition: 'opacity 0.4s ease, transform 0.4s ease',
                                                pointerEvents: showRateLimit ? 'auto' : 'none',
                                                animation: showRateLimit ? 'rateLimitPulse 1.2s ease-in-out infinite' : 'none',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faBolt} style={{ fontSize: '0.85vh', color: 'white' }} />
                                        </button>

                                        {/* Generic error icon (amber triangle) — any other failure */}
                                        <button
                                            className="absolute inset-0 flex items-center justify-center rounded-full border shadow-sm"
                                            title="Update failed — please try again"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                backgroundColor: '#f59e0b',
                                                borderColor: '#d97706',
                                                opacity: showGenericError ? 1 : 0,
                                                transform: showGenericError ? 'scale(1)' : 'scale(0.5)',
                                                transition: 'opacity 0.4s ease, transform 0.4s ease',
                                                pointerEvents: showGenericError ? 'auto' : 'none',
                                                animation: showGenericError ? 'genericErrorPulse 1.2s ease-in-out infinite' : 'none',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '0.85vh', color: 'white' }} />
                                        </button>

                                        {/* Wand button — default state */}
                                        <button
                                            className="absolute inset-0 bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                            onClick={handleFetchUpdate}
                                            title="Fetch match update"
                                            style={{
                                                opacity: (showRateLimit || showGenericError) ? 0 : 1,
                                                transform: (showRateLimit || showGenericError) ? 'scale(0.5)' : 'scale(1)',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                pointerEvents: (showRateLimit || showGenericError) ? 'none' : 'auto',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={isFetching ? faCircleNotch : faWandMagicSparkles} size="lg" className={isFetching ? 'animate-spin' : ''} style={{ fontSize: '0.9vh' }} />
                                        </button>


                                        <style>{`
                            @keyframes rateLimitPulse {
                                0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
                                50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
                            }
                            @keyframes genericErrorPulse {
                                0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.7); }
                                50% { box-shadow: 0 0 0 4px rgba(245,158,11,0); }
                            }
                        `}</style>
                                    </div>
                                )}
                                {tournamentID.slice(-2) === 'ps' && (
                                    <button
                                        className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                        onClick={(e) => handleMatchLock(e)}
                                        title={"Lock match"}
                                    >
                                        <FontAwesomeIcon icon={faUnlock} size="lg" style={{ fontSize: '0.9vh' }} />
                                    </button>
                                )}
                                <button
                                    className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                    onClick={(e) => (handleMatchTime(e))}
                                    title={"Edit match overs"}
                                >
                                    <FontAwesomeIcon icon={faClock} size="lg" style={{ fontSize: '0.9vh' }} />
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        onClick={() => handleClick('Away-win')}
                        onMouseEnter={() => setHoveredSection('Away-win')}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle('Away-win', 2)}>

                        <div className={`w-2/5 h-full flex justify-center items-center ${category === "franchise" ? "p-4" : "p-6"}`}>
                            <img className={`box-content max-w-full max-h-full object-contain ${category === "franchise" ? "" : "border border-zinc-200"}`} src={awayTeamLogo} alt={`${awayTeamName} Logo`} />
                        </div>

                        <div className="relative flex items-center justify-start text-[2.25vh] w-1/5 justify-start">
                            <span>{awayTeamName}</span>

                            {selected !== 'None' && <span className="absolute bottom-3 left-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Away-win', tossResultState === 'Away-win')}</span>
                            }
                        </div>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5">
                            {selected !== 'None' && <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            {selected !== 'None' && <div className="flex flex-row items-center justify-start w-full">

                                <div className="flex justify-start shrink-0">
                                    <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[4.5ch] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
                                        type="number"
                                        min="0.0"
                                        max={awayMaxOvers ?? (format === "T20" ? 20.0 : 50.0)}
                                        step="0.1"
                                        onChange={(event) => {
                                            let newVal = computeOverValue(event.target.value);
                                            if (awayMaxOvers && newVal > awayMaxOvers) {
                                                newVal = awayMaxOvers;
                                            }
                                            setAwayOvers(newVal);
                                            handleNRRChange({ awayOvers: newVal });
                                        }}
                                        value={awayOvers === 0 ? '' : (awayOvers ?? '')}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ color: 'inherit' }} />
                                </div>

                                {matchTimeChange && (
                                    <div className="flex flex-row items-center ml-1 text-[1.75vh] shrink-0">
                                        <span className="mr-0.5">(</span>
                                        <input className="border border-gray-300 rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[3ch] h-[2.2vh] py-0 outline-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
                                            type="number"
                                            min="0.0"
                                            max={format === "T20" ? 20.0 : 50.0}
                                            step="0.1"
                                            value={awayMaxOvers}
                                            onChange={async (event) => {
                                                let newVal = computeOverValue(event.target.value);
                                                setAwayMaxOvers(newVal);
                                                await handleMaxBallsChange("away", newVal);
                                                if (awayOvers && newVal && awayOvers > newVal) {
                                                    setAwayOvers(newVal);
                                                    handleNRRChange({ awayOvers: newVal })
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ color: 'inherit' }} />
                                        <span className="ml-0.5">)</span>
                                    </div>

                                )}
                            </div>}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 h-8 flex flex-row items-center justify-between bg-gray-300/20 text-[0.9vw]">
                    <div className={`flex justify-center items-center h-full flex-grow text-black cursor-pointer ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}
                        onClick={() => resetMatch('None')}
                        onMouseEnter={() => setHoveredSection("None")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={{
                            background: hoveredSection === "None" ? 'rgba(0, 0, 0, 0.1)' : 'transparent'
                        }}>
                        {group ? `${stage} · Group ${group} · Match ${matchNum} · ${venue}, ${city}` : `${stage} · Match ${matchNum} · ${venue}, ${city}`}
                    </div>
                </div>
            </div>
        </div >
    );
}

export default MatchCard;