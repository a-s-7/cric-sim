import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faCircleNotch, faUnlock, faBolt, faTriangleExclamation, faChevronUp, faChevronDown, faBan, faScissors, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import FetchStatusButton from "../buttons/FetchStatusButton";
import DeductionInput from "../inputs/DeductionInput";

function MatchCard({
    tournamentID,
    tournamentName,
    tournamentEdition,
    matchNum,
    homeGradient,
    awayGradient,
    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,
    venue,
    date,
    endDate,
    matchResult,
    onMatchUpdate,
    neutralGradient,
    stage,
    tossResult,
    tossDecision,
    city,
    format,
    category,
    series,
    seriesMatchNumber
}) {
    const [battingFirstToggle, setBattingFirstToggle] = useState(tossDecision === "bat");
    const [tossResultState, setTossResultState] = useState(tossResult);

    const [selected, setSelected] = useState(matchResult);
    const [hoveredSection, setHoveredSection] = useState(null);

    const [homeDeductionPoints, setHomeDeductionPoints] = useState(0);
    const [awayDeductionPoints, setAwayDeductionPoints] = useState(0);

    const [showDeductionFields, setShowDeductionFields] = useState(false);

    const [isFetching, setIsFetching] = useState(false);

    const [showRateLimit, setShowRateLimit] = useState(false);
    const rateLimitTimer = useRef(null);

    const [showGenericError, setShowGenericError] = useState(false);
    const genericErrorTimer = useRef(null);

    const [showAbandonGlow, setShowAbandonGlow] = useState(false);
    const abandonGlowTimer = useRef(null);

    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        setSelected(matchResult);
        setTossResultState(tossResult);
        setBattingFirstToggle(tossDecision === "bat");
    }, [matchResult, tossResult, tossDecision]);

    const goldGlow = "border border-[#D4AF37] shadow-[0_0_1.25rem_rgba(212,175,55,0.8)]";
    const silverGlow = "border border-[#BFC1C2] shadow-[0_0_1.25rem_rgba(191,193,194,0.9)]";

    const formattedDateObj = new Date(date);
    const timeZone = "America/Los_Angeles";

    const formatTestDateRange = (date, endDate) => {
        const start = new Date(date);
        const end = new Date(endDate);

        const startDay = start.getUTCDate();
        const endDay = end.getUTCDate();
        const startMonth = start.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC"
        });
        const endMonth = end.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC"
        });
        const year = end.getUTCFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${startDay}–${endDay}, ${year}`;
        }

        return `${startMonth} ${startDay}–${endMonth} ${endDay}, ${year}`;
    };

    const formattedTime = formattedDateObj.toLocaleTimeString("en-US", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).replace("AM", "a.m.").replace("PM", "p.m.");

    const ordinal = (n) => {
        if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;

        const suffix = ["th", "st", "nd", "rd"][n % 10] || "th";
        return `${n}${suffix}`;
    };

    const getStyle = (section, num) => {
        const gradients = [homeGradient, neutralGradient, awayGradient];
        const isSelected = selected === section && section !== "None";
        const isHovered = hoveredSection === section;
        const isLoser = selected !== 'None' && selected !== 'Draw' && !isSelected && section !== 'Draw' && section !== 'None';

        const background = isHovered ? 'rgba(0, 0, 0, 0.05)' : (isSelected ? gradients[num] : 'transparent');
        const color = isHovered ? 'black' : (isSelected ? 'white' : (isLoser ? '#959595' : 'black'));

        return {
            background: background,
            color: color
        };
    };

    const triggerAbandonGlow = () => {
        if (abandonGlowTimer.current) clearTimeout(abandonGlowTimer.current);
        setShowAbandonGlow(true);
        abandonGlowTimer.current = setTimeout(() => setShowAbandonGlow(false), 2000);
    };

    const handleClick = async (result) => {
        if (tossResultState === 'None') {
            triggerAbandonGlow();
            return;
        }
        setSelected(result);
        try {
            const response = await fetch(`/tournament/${tournamentID}/match/${matchNum}/${result}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                onMatchUpdate();
            } else {
                // alert("Error: Response not ok");
            }

        } catch (error) {
            // alert(error);
        }
    };

    const resetMatchData = async () => {
        try {
            const params = new URLSearchParams();
            params.set("match_nums", [matchNum]);

            const response = await fetch(`/tournament/${tournamentID}/match/clear?mode=match-numbers&${params.toString()}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                onMatchUpdate();
            } else {
                alert("Error: Response not ok");
            }
        } catch (error) {
            // alert(error);
        }
    };

    const resetMatch = async () => {
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

    const handleAbandonMatch = async (e) => {
        e.stopPropagation();

        if (tossResultState === 'None') {
            // Un-abandon: Restore default toss
            handleTossResultChange('Home-win');
        } else {
            // Abandon match
            try {
                const response = await fetch(`/tournament/${tournamentID}/match/${matchNum}/abandon`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    onMatchUpdate();
                } else {
                    // alert("Error: Response not ok");
                }
            } catch (error) {
                // alert(error);
            }
        }
    };

    const handleMatchLock = async (e) => {
        e.stopPropagation(); // Prevents setting the match to "Draw" on click

        try {
            const response = await fetch(
                `/tournament/${tournamentID}/match/${matchNum}/status/${'complete'}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (response.ok) {
                onMatchUpdate();
            } else {
                // alert("Failed to update match status.");
            }
        } catch (error) {
            // alert("Error updating match status: " + error.message);
        }
    };

    const handleTossResultChange = async (result) => {
        setTossResultState(result);

        try {
            const response = await fetch(
                `/tournament/${tournamentID}/match/${matchNum}/toss-result/${result}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (!response.ok) {
                // alert("Error: Response not ok");
            }
            onMatchUpdate();
        } catch (error) {
            // alert(error);
        }
    };

    const handleTossDecisionChange = async (battingFirst) => {
        setBattingFirstToggle(battingFirst);

        try {
            const response = await fetch(
                `/tournament/${tournamentID}/match/${matchNum}/toss-decision/${battingFirst ? 'bat' : 'bowl'}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            if (!response.ok) {
                // alert("Error: Response not ok");
            }
        } catch (error) {
            // alert(error);
        }
    };

    const handleDeductionChange = async (team, deduction) => {
        try {
            const response = await fetch(
                `/tournament/${tournamentID}/match/${matchNum}/team/${team}/deduction/${deduction}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.ok) {
                onMatchUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleDeductionFields = (e) => {
        e.stopPropagation();
        setShowDeductionFields(!showDeductionFields);
    }

    const getMatchResult = () => {
        if (selected === 'None') {
            return '';
        }
        if (selected === "Draw") {
            return 'Match drawn';
        }
        return selected === 'Home-win' ? homeTeamName + ' won' : awayTeamName + ' won';
    }

    const getTossSpan = (type, section, isTossWinner) => {
        const roleSrc = type === 'bat'
            ? "https://static.thenounproject.com/png/2005489-200.png"
            : "https://static.thenounproject.com/png/2485180-200.png";

        const isLoser = selected !== 'None' && selected !== 'Draw' && selected !== section;

        // Using solid neutral grey and white ring
        const baseColor = "bg-[#d1d5db]";
        const innerColor = "bg-[#d1d5db]";

        return (
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isTossWinner) return;
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
                <div className="flex items-center justify-center rounded-full w-[2.6vh] h-[2.6vh] bg-white shadow-sm transition-colors duration-200 group-hover/coin:bg-gray-700 has-[.inner-toss:hover]:bg-white">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isTossWinner) return;
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
                            {(showDeductionFields || homeDeductionPoints > 0) && <DeductionInput
                                value={homeDeductionPoints}
                                onChange={(points) => {
                                    setHomeDeductionPoints(points);
                                    handleDeductionChange("home", points);
                                }}
                                height="h-[3vh]"
                                displayMessage="DED"
                            />}
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
                        onClick={() => handleClick('Draw')}
                        onMouseEnter={() => setHoveredSection("Draw")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={getStyle("Draw", 1)}>
                        <div className={`w-full h-[32%] flex font-bold items-center justify-center text-[0.9vw] ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formatTestDateRange(date, endDate)}</div>
                        <div className="w-full h-[36%] flex items-center justify-center">
                            <div className={`uppercase text-inherit text-center px-2 ${selected === 'None' ? 'text-[1.3vw] font-["Reem_Kufi_Fun"] font-medium tracking-wide opacity-80' : 'text-[0.8vw] font-["Reem_Kufi_Fun"] font-bold tracking-wider leading-snug drop-shadow-sm'}`} style={{ WebkitTextStroke: selected !== 'None' ? '0.5px currentColor' : '0' }}>
                                {selected === 'None' ? 'VS' : getMatchResult().split('\n').map((line, i) => (
                                    <div key={i} className={i > 0 ? selected === "Draw" ? "" : "text-gray-600" : ""} style={{ fontSize: i === 0 ? '0.9vw' : '0.725vw' }}>{line}</div>
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
                                className="flex items-center justify-center w-[2.5vh] h-[1vh] transition-transform hover:scale-125 overflow-hidden"
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
                                {tournamentID.slice(-2) === 'ps' && (
                                    <button
                                        className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                        onClick={handleMatchLock}
                                        title={"Lock match"}
                                    >
                                        <FontAwesomeIcon icon={faUnlock} size="lg" style={{ fontSize: '0.9vh' }} />
                                    </button>
                                )}
                                <button
                                    className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                    onClick={toggleDeductionFields}
                                    disabled={tossResultState === 'None'}
                                    title="Show match deductions"
                                    style={{
                                        borderColor: showDeductionFields ? '#ef4444' : '',
                                        backgroundColor: showDeductionFields ? '#fee2e2' : '',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faMinusCircle}
                                        size="lg"
                                        style={{
                                            fontSize: '0.9vh',
                                            color: showDeductionFields ? '#ef4444' : 'inherit'
                                        }}
                                    />
                                </button>
                                <button
                                    className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                    onClick={handleAbandonMatch}
                                    title="Set match as abandoned"
                                    style={{
                                        borderColor: tossResultState === 'None' ? '#ef4444' : '',
                                        backgroundColor: tossResultState === 'None' ? '#fee2e2' : '',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faBan}
                                        size="lg"
                                        style={{
                                            fontSize: '0.9vh',
                                            color: tossResultState === 'None' ? '#ef4444' : 'inherit'
                                        }}
                                    />
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
                            {(showDeductionFields || awayDeductionPoints > 0) && <DeductionInput
                                value={awayDeductionPoints}
                                onChange={(points) => {
                                    setAwayDeductionPoints(points);
                                    handleDeductionChange("away", points);
                                }}
                                height="h-[3vh]"
                                displayMessage="DED"
                            />}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 h-8 flex flex-row items-center justify-between bg-gray-300/20 text-[0.9vw]">
                    <div className={`flex justify-center items-center h-full flex-grow text-black cursor-pointer ${selected !== 'None' ? 'opacity-50' : 'opacity-100'}`}
                        onClick={() => resetMatch()}
                        onMouseEnter={() => setHoveredSection("None")}
                        onMouseLeave={() => setHoveredSection(null)}
                        style={{
                            background: hoveredSection === "None" ? 'rgba(0, 0, 0, 0.1)' : 'transparent'
                        }}>
                        {stage === "Final" ? `${stage} · ${venue}, ${city}` : `${series} · ${ordinal(seriesMatchNumber)} Test · ${venue}, ${city}`}
                    </div>
                </div>
            </div>
        </div >
    );
}

export default MatchCard;