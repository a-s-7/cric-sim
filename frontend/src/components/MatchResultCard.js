import React from "react";

function MatchResultCard({
    homeGradient,
    awayGradient,
    homeTeamName,
    homeTeamLogo,
    awayTeamName,
    awayTeamLogo,
    homeConfirmed,
    awayConfirmed,
    tournamentName,
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
    homeSeed,
    awaySeed,
    tossResult,
    tossDecision,
    city,
    format,
    category
}) {
    const battingFirstToggle = tossDecision === "bat";

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

        background = matchResult === section ? gradients[num] : '#e8e8e8';
        color = matchResult === section ? 'white' : 'black';

        return {
            background: background,
            color: color
        };
    }


    const getWinningMargin = () => {
        const scores = {
            "Home": {
                runs: homeTeamRuns,
                wickets: homeTeamWickets,
                overs: homeTeamOvers,
                name: homeTeamName
            }, "Away": {
                runs: awayTeamRuns,
                wickets: awayTeamWickets,
                overs: awayTeamOvers,
                name: awayTeamName
            }
        }

        const homeBattedFirst = (tossResult === 'Home-win' && battingFirstToggle) ||
            (tossResult === 'Away-win' && !battingFirstToggle);

        const teamBattingFirst = homeBattedFirst ? "Home" : "Away";
        const teamBattingSecond = homeBattedFirst ? "Away" : "Home";

        if (scores[teamBattingSecond].runs > scores[teamBattingFirst].runs) {
            const wicketsRemaining = 10 - scores[teamBattingSecond].wickets;

            const [overs, balls = 0] = scores[teamBattingSecond].overs.toString().split('.');
            const ballsRemaining = parseInt(balls) + (parseInt(overs) * 6);

            return `${scores[teamBattingSecond].name} won by ${wicketsRemaining} ${wicketsRemaining === 1 ? 'wicket' : 'wickets'}\n(${format === "T20" ? 120 - ballsRemaining : 300 - ballsRemaining} balls left)`;
        } else if (scores[teamBattingSecond].runs < scores[teamBattingFirst].runs) {
            return `${scores[teamBattingFirst].name} won by ${scores[teamBattingFirst].runs - scores[teamBattingSecond].runs} ${scores[teamBattingFirst].runs - scores[teamBattingSecond].runs === 1 ? 'run' : 'runs'}`;
        } else {
            return `${matchResult === "Home-win" ? scores[teamBattingFirst].name : scores[teamBattingSecond].name} won the Super Over`;
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
        <div className={`shadow-lg rounded-[36px] border ${getBorderClass()} overflow-hidden flex w-auto`}>
            <div className="h-44 w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-36">
                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5">
                            {matchResult !== 'None' && <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={homeTeamRuns === 0 ? '' : (homeTeamRuns ?? '')}
                                    style={{ color: 'inherit' }}
                                />

                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={homeTeamWickets === 0 ? '' : (homeTeamWickets ?? '')}
                                    style={{ color: 'inherit' }} />
                            </div>}
                            {matchResult !== 'None' && <div className="flex justify-end">
                                <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    value={homeTeamOvers === 0 ? '' : (homeTeamOvers ?? '')}
                                    style={{ color: 'inherit' }} />
                            </div>}

                        </div>

                        <div className="relative flex items-center justify-end text-[2.25vh] w-1/5 h-full">
                            <span> {homeConfirmed ? homeTeamName : homeSeed}</span>

                            {matchResult !== 'None' && <span className="absolute bottom-3 right-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Home-win', tossResult === 'Home-win')}</span>
                            }
                        </div>

                        <div className={`w-[36%] flex justify-center items-center ${category === "franchise" ? "p-5" : "p-6"}`}>
                            <img className={`box-content w-full ${category === "franchise" ? "" : "border border-zinc-200"}`} src={homeTeamLogo ? homeTeamLogo : "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14"} style={{ filter: homeConfirmed === false && homeTeamLogo !== "" ? 'blur(4px)' : 'none' }} alt={`${homeTeamName} Logo`}></img>
                        </div>
                    </div>

                    <div className='flex flex-col border-l border-r border-gray-100 w-[27%] cursor-pointer'
                        style={getStyle("No-result", 1)}>
                        <div className={`w-full h-[30%] flex font-bold items-center justify-center text-[0.9vw] ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedDate}</div>
                        <div className="w-full h-2/5 flex items-center justify-center">
                            <div className={`uppercase text-inherit text-center px-2 ${matchResult === 'None' ? 'text-[1.3vw] font-["Reem_Kufi_Fun"] font-medium tracking-wide opacity-80' : 'text-[0.8vw] font-["Reem_Kufi_Fun"] font-bold tracking-wider leading-snug drop-shadow-sm'}`} style={{ WebkitTextStroke: matchResult !== 'None' ? '0.5px currentColor' : '0' }}>
                                {matchResult === 'None' ? 'VS' : getMatchResult().split('\n').map((line, i) => (
                                    <div key={i} className={i !== 0 ? "text-gray-600" : ""} style={{ fontSize: i === 0 ? '0.9vw' : '0.75vw' }}>{line}</div>
                                ))}
                            </div>
                        </div>
                        <div className={`w-full h-[30%] flex items-center justify-center text-[0.75vw] ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedTime}</div>

                    </div>

                    <div className='flex flex-row w-[36.5%] font-["Reem_Kufi_Fun"] uppercase cursor-pointer'
                        style={getStyle('Away-win', 2)}>

                        <div className={`w-[36%] flex justify-center items-center ${category === "franchise" ? "p-5" : "p-6"}`}>
                            <img className={`box-content w-full ${category === "franchise" ? "" : "border border-zinc-200"}`} src={awayTeamLogo ? awayTeamLogo : "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14"} style={{ filter: awayConfirmed === false && awayTeamLogo !== "" ? 'blur(4px)' : 'none' }} alt={`${awayTeamName} Logo`}></img>
                        </div>

                        <div className="relative flex items-center justify-start text-[2.25vh] w-1/5 justify-start">
                            <span>{awayConfirmed ? awayTeamName : awaySeed}</span>

                            {matchResult !== 'None' && <span className="absolute bottom-3 left-0">
                                {getTossSpan(battingFirstToggle ? 'bat' : 'bowl', 'Away-win', tossResult === 'Away-win')}</span>
                            }
                        </div>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5">
                            {matchResult !== 'None' && <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[40%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={awayTeamRuns === 0 ? '' : (awayTeamRuns ?? '')}
                                    style={{ color: 'inherit' }} />
                                <h2 className="mx-1" style={{ color: 'inherit' }}>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-[25%] h-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={awayTeamWickets === 0 ? '' : (awayTeamWickets ?? '')}
                                    style={{ color: 'inherit' }} />
                            </div>}
                            {matchResult !== 'None' && <div className="flex justify-start">
                                <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type="number"
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    value={awayTeamOvers === 0 ? '' : (awayTeamOvers ?? '')}
                                    style={{ color: 'inherit' }} />
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