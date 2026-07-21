import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faCircleNotch, faUnlock, faBolt, faTriangleExclamation, faClock, faBullseye, faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import BallsInput from "./BallsInput";
import RunsInput from "./RunsInput";
import WicketsInput from "./WicketsInput";
import FetchStatusButton from "./FetchStatusButton";

function MatchCard({
    tournamentID,
    tournamentName,
    tournamentEdition,
    matchNum,
    homeGradient,
    awayGradient,
    homeTeamName,
    homeTeamLogo,
    awayTeamName,
    awayTeamLogo,
    venue,
    date,
    matchResult,
    onMatchUpdate,
    homeTeamRuns,
    homeTeamBalls,
    homeTeamMaxBalls,
    awayTeamRuns,
    awayTeamBalls,
    awayTeamMaxBalls,
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
    inningsBalls,
}) {
    const [awayRuns, setAwayRuns] = useState(awayTeamRuns);
    const [awayWickets, setAwayWickets] = useState(awayTeamWickets);
    const [awayBalls, setAwayBalls] = useState(awayTeamBalls);
    const [awayMaxBalls, setAwayMaxBalls] = useState(awayTeamMaxBalls);

    const [homeRuns, setHomeRuns] = useState(homeTeamRuns);
    const [homeWickets, setHomeWickets] = useState(homeTeamWickets);
    const [homeBalls, setHomeBalls] = useState(homeTeamBalls);
    const [homeMaxBalls, setHomeMaxBalls] = useState(homeTeamMaxBalls);

    const [battingFirstToggle, setBattingFirstToggle] = useState(tossDecision === "bat");
    const [tossResultState, setTossResultState] = useState(tossResult);

    const [matchTimeChange, setMatchTimeChange] = useState(homeTeamMaxBalls !== inningsBalls || awayTeamMaxBalls !== inningsBalls);

    const [matchTargetStatus, setMatchTargetStatus] = useState(false);
    const [matchTargetRuns, setMatchTargetRuns] = useState();

    const [selected, setSelected] = useState(matchResult);
    const [hoveredSection, setHoveredSection] = useState(null);

    const [isFetching, setIsFetching] = useState(false);

    const [showRateLimit, setShowRateLimit] = useState(false);
    const rateLimitTimer = useRef(null);

    const [showGenericError, setShowGenericError] = useState(false);
    const genericErrorTimer = useRef(null);

    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        setSelected(matchResult);
        setAwayRuns(awayTeamRuns);
        setAwayWickets(awayTeamWickets);
        setAwayBalls(awayTeamBalls);
        setHomeRuns(homeTeamRuns);
        setHomeWickets(homeTeamWickets);
        setHomeBalls(homeTeamBalls);
    }, [matchResult, awayTeamRuns, awayTeamWickets, awayTeamBalls, homeTeamRuns, homeTeamWickets, homeTeamBalls]);

    const goldGlow = "border border-[#D4AF37] shadow-[0_0_1.25rem_rgba(212,175,55,0.8)]";
    const silverGlow = "border border-[#BFC1C2] shadow-[0_0_1.25rem_rgba(191,193,194,0.9)]";

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

    const validateAndParseScores = (overrides, currentValues) => {
        const { homeRuns, awayRuns, homeBalls, awayBalls, homeWickets, awayWickets } = currentValues;

        const getValue = (overrideVal, stateVal) => {
            const raw = overrideVal ?? stateVal;
            if (raw === '' || raw === null || raw === undefined) return null;
            const parsed = parseFloat(raw);
            return isNaN(parsed) ? null : parsed;
        };

        const homeRunsValue = getValue(overrides.homeRuns, homeRuns);
        const awayRunsValue = getValue(overrides.awayRuns, awayRuns);
        const homeBallsValue = getValue(overrides.homeBalls, homeBalls);
        const awayBallsValue = getValue(overrides.awayBalls, awayBalls);
        const homeWicketsValue = getValue(overrides.homeWickets, homeWickets);
        const awayWicketsValue = getValue(overrides.awayWickets, awayWickets);

        const allValid =
            homeRunsValue != null && homeRunsValue >= 0 &&
            awayRunsValue != null && awayRunsValue >= 0 &&
            homeWicketsValue != null && homeWicketsValue >= 0 &&
            awayWicketsValue != null && awayWicketsValue >= 0 &&
            homeBallsValue != null && homeBallsValue > 0 &&
            awayBallsValue != null && awayBallsValue > 0;

        if (!allValid) return null;

        return {
            homeRunsValue,
            awayRunsValue,
            homeBallsValue,
            awayBallsValue,
            homeWicketsValue,
            awayWicketsValue
        };
    };

    const handleNRRChange = async (overrides = {}) => {
        const parsedScores = validateAndParseScores(overrides, {
            homeRuns, awayRuns, homeBalls, awayBalls, homeWickets, awayWickets
        });

        if (!parsedScores) return;

        const {
            homeRunsValue,
            awayRunsValue,
            homeBallsValue,
            awayBallsValue,
            homeWicketsValue,
            awayWicketsValue
        } = parsedScores;

        try {
            const scoreKey = `${homeRunsValue}/${homeWicketsValue}/${homeBallsValue}/${awayRunsValue}/${awayWicketsValue}/${awayBallsValue}`;

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
        setHomeBalls('');
        setAwayRuns('');
        setAwayWickets('');
        setAwayBalls('');
        setHomeMaxBalls(inningsBalls);
        setAwayMaxBalls(inningsBalls);
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
            homeRuns, awayRuns, homeBalls, awayBalls, homeWickets, awayWickets
        });

        if (!parsedScores) {
            return selected === "Home-win" ? `${homeTeamName} won` : `${awayTeamName} won`;
        }

        const {
            homeRunsValue,
            awayRunsValue,
            homeBallsValue,
            awayBallsValue,
            homeWicketsValue,
            awayWicketsValue
        } = parsedScores;

        const scores = {
            "Home": {
                runs: homeRunsValue,
                wickets: homeWicketsValue,
                balls: homeBallsValue,
                maxBalls: homeMaxBalls,
                name: homeTeamName
            }, "Away": {
                runs: awayRunsValue,
                wickets: awayWicketsValue,
                balls: awayBallsValue,
                maxBalls: awayMaxBalls,
                name: awayTeamName
            }
        }

        const homeBattedFirst = (tossResultState === 'Home-win' && battingFirstToggle) ||
            (tossResultState === 'Away-win' && !battingFirstToggle);

        const teamBattingFirst = homeBattedFirst ? "Home" : "Away";
        const teamBattingSecond = homeBattedFirst ? "Away" : "Home";

        if (scores[teamBattingSecond].runs > scores[teamBattingFirst].runs) {
            const wicketsRemaining = 10 - scores[teamBattingSecond].wickets;

            const ballsPlayed = scores[teamBattingSecond].balls;
            const maxBalls = scores[teamBattingSecond].maxBalls;
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

    const toggleInningsLengthDisplay = (e) => {
        e.stopPropagation();
        setMatchTimeChange(!matchTimeChange);
    };

    const toggleInningsTargetDisplay = (e) => {
        e.stopPropagation();
        setMatchTargetStatus(!matchTargetStatus);
    }

    const handleMaxBallsChange = async (team, max_balls) => {
        if (max_balls === '' || max_balls === null) {
            return;
        }
        const params = new URLSearchParams();
        params.set("team", team);
        params.set("max_balls", max_balls);

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

    const getBorderClass = () => {
        if (!stage) return "border-[#cec7c7]";
        if (stage === "Final") return goldGlow;
        if (stage.includes("Semi-final")) return silverGlow;
        return "border-[#cec7c7]";
    };

    return (
        <div className={`shadow-lg rounded-[36px] border ${getBorderClass()} overflow-hidden flex`}>
            <div className="h-44 w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-36">
                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        onClick={() => handleClick('Home-win')}
                        onMouseEnter={() => setHoveredSection("Home-win")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5 relative">
                            {selected !== 'None' && <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                {/* Home Team Runs */}
                                <RunsInput
                                    value={homeRuns}
                                    onChange={(runs) => {
                                        setHomeRuns(runs);
                                        handleNRRChange({ homeRuns: runs });
                                    }}
                                />
                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                {/* Home Team Wickets */}
                                <WicketsInput value={homeWickets}
                                    onChange={(v) => {
                                        setHomeWickets(v);
                                        handleNRRChange({ homeWickets: v });
                                    }}
                                />
                            </div>}
                            {selected !== 'None' && <div className="flex flex-row items-center justify-end w-full">
                                {matchTimeChange && (
                                    <div className="flex flex-row items-center ml-1 text-[1.75vh] shrink-0">
                                        <span className="mr-0.5">(</span>
                                        {/* Home Team Max Balls*/}
                                        <BallsInput
                                            width="3ch"
                                            mode={format === "HUNDRED" ? "balls" : "overs"}
                                            max={inningsBalls}
                                            value={homeMaxBalls}
                                            onChange={async (balls) => {
                                                setHomeMaxBalls(balls);
                                                await handleMaxBallsChange("home", balls);

                                                if (homeBalls && balls && Number(homeBalls) > Number(balls)) {
                                                    setHomeBalls(balls);
                                                    handleNRRChange({ homeBalls: balls });
                                                }
                                            }}
                                        />
                                        <span className="ml-0.5">)</span>
                                    </div>
                                )}
                                <div className="flex justify-end ml-1 shrink-0">
                                    {/* Home Team Balls*/}
                                    <BallsInput
                                        width="4.5ch"
                                        mode={format === "HUNDRED" ? "balls" : "overs"}
                                        max={homeMaxBalls}
                                        value={homeBalls === 0 ? '' : (homeBalls ?? '')}
                                        onChange={(balls) => {
                                            setHomeBalls(balls);
                                            handleNRRChange({ homeBalls: balls });
                                        }}
                                    />
                                </div>
                            </div>
                            }

                            {selected !== "None" && matchTargetStatus && ((tossResultState === 'Home-win' && !battingFirstToggle) || (tossResultState === 'Away-win' && battingFirstToggle)) && <div className="absolute bottom-2 right-0 flex flex-row items-center justify-end w-full pr-2">
                                <span className="mr-0.5 text-[1vh]">TARGET</span>
                                <input className="border border-gray-300 text-[1.25vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[3.5ch] h-[2vh] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0 ml-1 outline-none focus:outline-none"
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={matchTargetRuns ?? ''}
                                    onChange={(event) => setMatchTargetRuns(event.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: 'inherit' }}
                                />
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
                        <div className={`w-full h-[32%] flex font-bold items-center justify-center text-[0.9vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedDate}</div>
                        <div className="w-full h-[36%] flex items-center justify-center">
                            <div className={`uppercase text-inherit text-center px-2 ${selected === 'None' ? 'text-[1.3vw] font-["Reem_Kufi_Fun"] font-medium tracking-wide opacity-80' : 'text-[0.8vw] font-["Reem_Kufi_Fun"] font-bold tracking-wider leading-snug drop-shadow-sm'}`} style={{ WebkitTextStroke: selected !== 'None' ? '0.5px currentColor' : '0' }}>
                                {selected === 'None' ? 'VS' : getMatchResult().split('\n').map((line, i) => (
                                    <div key={i} className={i !== 0 ? "text-gray-600" : ""} style={{ fontSize: i === 0 ? '0.9vw' : '0.75vw' }}>{line}</div>
                                ))}
                            </div>
                        </div>

                        <div className={`flex flex-col w-full h-[32%] items-center justify-between text-[0.75vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>
                            {/* Time */}
                            <div className="leading-none">
                                <span>{formattedTime}</span>
                            </div>

                            {/* Handle */}
                            <button
                                className="flex items-center justify-center w-[2.5vh] h-[1vh] transition-colors overflow-hidden"
                                onClick={(e) => { e.stopPropagation(); setDrawerOpen(prev => !prev); }}
                                title="More actions"
                            >
                                <FontAwesomeIcon icon={drawerOpen ? faChevronUp : faChevronDown} style={{ fontSize: '0.75vh' }} />
                            </button>

                            {/* Buttons - fade in from bottom */}
                            <div
                                className="w-full flex gap-1 items-center justify-center pb-1"
                                style={{
                                    opacity: drawerOpen ? 1 : 0,
                                    transform: drawerOpen ? 'translateY(0)' : 'translateY(0)',
                                    pointerEvents: drawerOpen ? 'auto' : 'none',
                                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                {formattedDateObj < new Date() && (tournamentID.slice(-2) === 'rw') && (
                                    <div className="relative flex items-center justify-center w-[1.8vh] h-[1.8vh]">
                                        <FetchStatusButton
                                            show={showRateLimit}
                                            icon={faBolt}
                                            title="Gemini quota exhausted — please wait"
                                            bgColor="#ef4444"
                                            borderColor="#f87171"
                                            animationName="rateLimitPulse"
                                        />
                                        <FetchStatusButton
                                            show={showGenericError}
                                            icon={faTriangleExclamation}
                                            title="Update failed — please try again"
                                            bgColor="#f59e0b"
                                            borderColor="#d97706"
                                            animationName="genericErrorPulse"
                                        />
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
                                    </div>
                                )}
                                <button
                                    className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                    onClick={(e) => (toggleInningsLengthDisplay(e))}
                                    title={`Edit match ${format === "HUNDRED" ? "balls" : "overs"}`}
                                >
                                    <FontAwesomeIcon icon={faClock} size="lg" style={{ fontSize: '0.9vh' }} />
                                </button>
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
                                    onClick={(e) => (toggleInningsTargetDisplay(e))}
                                    title={`Edit match ${format === "HUNDRED" ? "balls" : "overs"}`}
                                >
                                    <FontAwesomeIcon icon={faBullseye} size="lg" style={{ fontSize: '0.9vh' }} />
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

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5 relative">
                            {selected !== 'None' && <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                {/* Away Team Runs */}
                                <RunsInput
                                    value={awayRuns}
                                    onChange={(runs) => {
                                        setAwayRuns(runs);
                                        handleNRRChange({ awayRuns: runs });
                                    }}
                                />
                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                {/* Away Team Wickets*/}
                                <WicketsInput value={awayWickets}
                                    onChange={(v) => {
                                        setAwayWickets(v);
                                        handleNRRChange({ awayWickets: v });
                                    }}
                                />

                            </div>}
                            {selected !== 'None' && <div className="flex flex-row items-center justify-start w-full">
                                {/* Away Team Balls*/}
                                <div className="flex justify-start shrink-0">
                                    <BallsInput
                                        width="4.5ch"
                                        mode={format === "HUNDRED" ? "balls" : "overs"}
                                        max={awayMaxBalls}
                                        value={awayBalls === 0 ? '' : (awayBalls ?? '')}
                                        onChange={(balls) => {
                                            setAwayBalls(balls);
                                            handleNRRChange({ awayBalls: balls });
                                        }}
                                    />
                                </div>

                                {matchTimeChange && (
                                    <div className="flex flex-row items-center ml-1 text-[1.75vh] shrink-0">
                                        <span className="mr-0.5">(</span>
                                        {/* Away Team Max Balls*/}
                                        <BallsInput
                                            width="3ch"
                                            mode={format === "HUNDRED" ? "balls" : "overs"}
                                            max={inningsBalls}
                                            value={awayMaxBalls}
                                            onChange={async (balls) => {
                                                setAwayMaxBalls(balls);
                                                await handleMaxBallsChange("away", balls);
                                                if (awayBalls && balls && Number(awayBalls) > Number(balls)) {
                                                    setAwayBalls(balls);
                                                    handleNRRChange({ awayBalls: balls });
                                                }
                                            }}
                                        />
                                        <span className="ml-0.5">)</span>
                                    </div>
                                )}
                                {selected !== "None" && matchTargetStatus && ((tossResultState === 'Home-win' && battingFirstToggle) || (tossResultState === 'Away-win' && !battingFirstToggle)) && <div className="absolute bottom-2 left-0 flex flex-row items-center justify-start w-full pl-2">
                                    <span className="mr-0.5 text-[1vh]">TARGET</span>
                                    <input className="border border-gray-300 text-[1.25vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[3.5ch] h-[2vh] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0 ml-1 outline-none focus:outline-none"
                                        type="number"
                                        min="0"
                                        max="1000"
                                        value={matchTargetRuns ?? ''}
                                        onChange={(event) => setMatchTargetRuns(event.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ color: 'inherit' }}
                                    />
                                </div>
                                }
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
        </div>
    );
}

export default MatchCard;