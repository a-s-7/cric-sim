import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import BallsInput from "./BallsInput";

function MatchResultCard({
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
    homeConfirmed,
    awayConfirmed,
    onMatchUpdate,
    venue,
    date,
    matchResult,
    homeTeamRuns,
    homeTeamBalls,
    awayTeamRuns,
    awayTeamBalls,
    awayTeamWickets,
    homeTeamWickets,
    neutralGradient,
    group,
    stage,
    homeSeed,
    awaySeed,
    tossResult,
    tossDecision,
    city,
    format,
    category,
    homeMaxBalls,
    awayMaxBalls,
    inningsBalls
}) {
    const battingFirstToggle = tossDecision === "bat";

    const homeLost = matchResult === 'Away-win';
    const awayLost = matchResult === 'Home-win';

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
        let background = 'transparent';
        let color = 'black';
        const gradients = [homeGradient, neutralGradient, awayGradient];

        background = matchResult === section ? gradients[num] : '#f0ededff';


        color = matchResult === section ? 'white' : 'black';

        return {
            background: background,
            color: color
        };
    }

    const handleMatchUnlock = async (e) => {
        try {
            const response = await fetch(
                `/tournaments/${tournamentID}/match/status/${matchNum}/${'incomplete'}`,
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


    const getWinningMargin = () => {
        const scores = {
            "Home": {
                runs: homeTeamRuns,
                wickets: homeTeamWickets,
                balls: homeTeamBalls,
                maxBalls: homeMaxBalls,
                name: homeTeamName
            }, "Away": {
                runs: awayTeamRuns,
                wickets: awayTeamWickets,
                balls: awayTeamBalls,
                maxBalls: awayMaxBalls,
                name: awayTeamName
            }
        }

        const homeBattedFirst = (tossResult === 'Home-win' && battingFirstToggle) ||
            (tossResult === 'Away-win' && !battingFirstToggle);

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
        if (matchResult === 'None') {
            return '';
        } else if (matchResult === "No-result") {
            return 'No Result';
        } else {
            return getWinningMargin()
        }
    }

    const getTossSpan = (type, section, isTossWinner) => {
        const roleSrc = type === 'bat'
            ? "https://static.thenounproject.com/png/2005489-200.png"
            : "https://static.thenounproject.com/png/2485180-200.png";

        const isLoser = matchResult !== 'None' && matchResult !== 'No-result' && matchResult !== section;

        // Using solid neutral grey and white ring
        const baseColor = "bg-[#d1d5db]";
        const innerColor = "bg-[#d1d5db]";

        return (
            <div
                className={`flex items-center justify-center rounded-full transition-all duration-500 ease-in-out border border-white/20 ${baseColor} group/coin`}
                style={{
                    width: "3vh",
                    height: "3vh",
                    boxShadow: isTossWinner && !isLoser ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    opacity: isTossWinner ? (isLoser ? 0.4 : 1) : 0,
                    transform: isTossWinner ? 'scale(1)' : 'scale(0.4)',
                }}
            >
                <div className="flex items-center justify-center rounded-full w-[2.6vh] h-[2.6vh] bg-white shadow-sm transition-colors duration-200">
                    <div
                        className={`inner-toss flex items-center justify-center rounded-full transition-colors duration-200 ${innerColor}`}
                        style={{
                            width: "2vh",
                            height: "2vh",
                        }}
                    >
                        <img
                            src={roleSrc}
                            alt={type}
                            className="w-[1.4vh] h-[1.4vh] opacity-60 transition-all duration-200 filter-none"
                        />
                    </div>
                </div>
            </div>
        );
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
            <div className="h-44 w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-36">
                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5"
                            style={{ opacity: homeLost ? 0.4 : 1 }}>
                            {matchResult !== 'None' && <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                {/* Home Team Runs */}
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    value={homeTeamRuns === 0 ? '' : (homeTeamRuns ?? '')}
                                    style={{ color: 'inherit' }}
                                />
                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                {/* Home Team Wickets */}
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    value={homeTeamWickets === 0 ? '' : (homeTeamWickets ?? '')}
                                    style={{ color: 'inherit' }} />
                            </div>}
                            {matchResult !== 'None' && <div className="flex flex-row items-center justify-end w-full">
                                {(homeMaxBalls !== inningsBalls || awayMaxBalls !== inningsBalls) && (
                                    <div className="flex flex-row items-center ml-1 text-[1.75vh] shrink-0">
                                        <span className="mr-0.5">(</span>
                                        {/* Home Team Max Balls*/}
                                        <BallsInput
                                            width="3ch"
                                            mode={format === "HUNDRED" ? "balls" : "overs"}
                                            value={homeMaxBalls}
                                            readOnly={true}
                                        />
                                        <span className="ml-0.5">)</span>
                                    </div>
                                )}
                                <div className="flex justify-end ml-1 shrink-0">
                                    {/* Home Team Balls*/}
                                    <BallsInput
                                        width="4.5ch"
                                        mode={format === "HUNDRED" ? "balls" : "overs"}
                                        value={homeTeamBalls === 0 ? '' : (homeTeamBalls ?? '')}
                                        readOnly={true}
                                    />
                                </div>
                            </div>}

                        </div>

                        <div className="relative flex items-center justify-end text-[2.25vh] w-1/5 h-full">
                            <span style={{ opacity: homeLost ? 0.4 : 1 }}> {homeConfirmed ? homeTeamName : homeSeed}</span>

                            {matchResult !== 'None' && <span className="absolute bottom-3 right-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Home-win', tossResult === 'Home-win')}</span>
                            }
                        </div>

                        <div className={`w-2/5 h-full flex justify-center items-center ${category === "franchise" ? "p-4" : "p-6"}`}>
                            <img className={`box-content max-w-full max-h-full object-contain ${category === "franchise" ? "" : "border border-zinc-200"}`} src={homeTeamLogo ? homeTeamLogo : "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14"} style={{ filter: homeConfirmed === false && homeTeamLogo !== "" ? 'blur(4px)' : 'none' }} alt={`${homeTeamName} Logo`}></img>
                        </div>
                    </div>

                    <div className='flex flex-col border-l border-r border-gray-100 w-[27%] cursor-pointer'
                        style={getStyle("No-result", 1)}>
                        <div className={`w-full h-[32%] flex font-bold items-center justify-center text-[0.9vw] ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedDate}</div>
                        <div className="w-full h-[36%] h-2/5 flex items-center justify-center">
                            <div className={`uppercase text-inherit text-center px-2 ${matchResult === 'None' ? 'text-[1.3vw] font-["Reem_Kufi_Fun"] font-medium tracking-wide opacity-80' : 'text-[0.8vw] font-["Reem_Kufi_Fun"] font-bold tracking-wider leading-snug drop-shadow-sm'}`} style={{ WebkitTextStroke: matchResult !== 'None' ? '0.5px currentColor' : '0' }}>
                                {matchResult === 'None' ? 'VS' : getMatchResult().split('\n').map((line, i) => (
                                    <div key={i} className={i !== 0 ? "text-gray-500" : ""} style={{ fontSize: i === 0 ? '0.9vw' : '0.75vw' }}>{line}</div>
                                ))}
                            </div>
                        </div>
                        <div className={`w-full h-[32%] flex flex-col items-center justify-between text-[0.75vw] ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="leading-none">
                                <span>{formattedTime}</span>
                            </div>

                            <div className="w-full flex justify-center items-center">
                                {tournamentID.slice(-2) === 'ps' && homeConfirmed && awayConfirmed && (
                                    <button
                                        className="bg-white hover:bg-zinc-100 text-zinc-800 hover:text-black transition-all duration-300 shadow-sm border border-zinc-200 hover:border-zinc-400 flex items-center justify-center rounded-full w-[1.8vh] h-[1.8vh] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                        onClick={handleMatchUnlock}
                                        title={"Unlock match"}
                                    >
                                        <FontAwesomeIcon icon={faLock} size="lg" style={{ fontSize: '0.9vh' }} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        style={getStyle('Away-win', 2)}>

                        <div className={`w-2/5 h-full flex justify-center items-center ${category === "franchise" ? "p-4" : "p-6"}`}>
                            <img className={`box-content max-w-full max-h-full object-contain ${category === "franchise" ? "" : "border border-zinc-200"}`} src={awayTeamLogo ? awayTeamLogo : "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14"} style={{ filter: awayConfirmed === false && awayTeamLogo !== "" ? 'blur(4px)' : 'none' }} alt={`${awayTeamName} Logo`}></img>
                        </div>

                        <div className="relative flex items-center justify-start text-[2.25vh] w-1/5 justify-start">
                            <span style={{ opacity: awayLost ? 0.4 : 1 }}>{awayConfirmed ? awayTeamName : awaySeed}</span>

                            {matchResult !== 'None' && <span className="absolute bottom-3 left-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Away-win', tossResult === 'Away-win')}</span>
                            }
                        </div>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5"
                            style={{ opacity: awayLost ? 0.4 : 1 }}>
                            {matchResult !== 'None' && <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                {/* Away Team Runs*/}
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    value={awayTeamRuns === 0 ? '' : (awayTeamRuns ?? '')}
                                    style={{ color: 'inherit' }} />
                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                {/* Away Team Wickets*/}
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    value={awayTeamWickets === 0 ? '' : (awayTeamWickets ?? '')}
                                    style={{ color: 'inherit' }} />
                            </div>}
                            {matchResult !== 'None' && <div className="flex flex-row items-center justify-start w-full">
                                <div className="flex justify-start shrink-0">
                                    {/* Away Team Balls*/}
                                    <BallsInput
                                        width="4.5ch"
                                        mode={format === "HUNDRED" ? "balls" : "overs"}
                                        value={awayTeamBalls === 0 ? '' : (awayTeamBalls ?? '')}
                                        readOnly={true}
                                    />
                                </div>
                                {(homeMaxBalls !== inningsBalls || awayMaxBalls !== inningsBalls) && (
                                    <div className="flex flex-row items-center ml-1 text-[1.75vh] shrink-0">
                                        <span className="mr-0.5">(</span>
                                        {/* Away Team Max Balls*/}
                                        <BallsInput
                                            width="3ch"
                                            mode={format === "HUNDRED" ? "balls" : "overs"}
                                            value={awayMaxBalls}
                                            readOnly={true}
                                        />
                                    </div>
                                )}
                            </div>}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 h-8 flex flex-row items-center justify-between bg-gray-300/20 text-[0.9vw]">
                    <div className={`flex justify-center items-center h-full flex-grow text-black cursor-pointer ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>
                        {group ? `${stage} · Group ${group} · Match ${matchNum} · ${venue}, ${city}` : `${stage} · Match ${matchNum} · ${venue}, ${city}`}
                    </div>
                </div>
            </div>
        </div >
    );
}

export default MatchResultCard;