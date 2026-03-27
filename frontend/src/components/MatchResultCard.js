import React from "react";

function MatchResultCard({
    homeGradient,
    awayGradient,
    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,
    tournamentName,
    tournamentEdition,
    matchNum,
    venue,
    date,
    matchResult,
    homeTeamRuns,
    homeTeamWickets,
    homeTeamOvers,
    awayTeamRuns,
    awayTeamWickets,
    awayTeamOvers,
    neutralGradient,
    group,
    stage,
    homeSeed,
    awaySeed,
    homeConfirmed,
    awayConfirmed,
    city,
    category
}) {

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

    const goldGlow = "border border-[#D4AF37] shadow-[0_0_1.25rem_rgba(212,175,55,0.8)]";
    const silverGlow = "border border-[#BFC1C2] shadow-[0_0_1.25rem_rgba(191,193,194,0.9)]";

    const getBorderClass = () => {
        if (!stage) return "border-[#cec7c7]";
        if (stage === "Final") return goldGlow;
        if (stage.includes("Semi-final")) return silverGlow;
        return "border-[#cec7c7]";
    };

    return (
        <div className={`shadow-md rounded-[36px] border ${getBorderClass()} overflow-hidden flex w-auto`}>
            <div className="h-44 w-full flex flex-col bg-white font-['Nunito_Sans']">
                <div className="flex flex-row h-36">
                    <div className='flex flex-row w-[37.5%] font-["Reem_Kufi_Fun"] uppercase'
                        style={getStyle("Home-win", 0)}>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-end w-2/5">
                            {matchResult !== "None" && <div className="flex justify-end items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[35%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    step="1"
                                    value={homeTeamRuns || ''}
                                    readOnly
                                    style={{ color: matchResult === "Home-win" ? "white" : "black" }} />
                                <h2>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-1/5 h-full ml-0.5 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={homeTeamWickets || ''}
                                    readOnly
                                    style={{ color: matchResult === "Home-win" ? "white" : "black" }} />
                            </div>}
                            {matchResult !== "None" && <div className="flex justify-end">
                                <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    value={homeTeamOvers || ''}
                                    readOnly
                                    style={{ color: matchResult === "Home-win" ? "white" : "black" }} />
                            </div>}
                        </div>

                        <div className="flex items-center text-[2vh] w-1/5 justify-end">
                            {homeConfirmed ? homeTeamName : homeSeed}
                        </div>

                        <div className={`w-[36%] flex justify-center items-center ${category === "franchise" ? "p-5" : "p-6"}`}>
                            <div className="relative w-full">
                                <img className={`box-content w-full ${category === "franchise" ? "" : "border border-zinc-200"}`} style={{ filter: homeConfirmed === false && homeTeamLogo !== "" ? 'blur(4px)' : 'none' }} src={homeTeamLogo ? homeTeamLogo : "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14"} alt={`${homeTeamName} Logo`}></img>
                                {/* {!homeConfirmed && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-black font-bold text-[2.5vh] font-['Reem_Kufi_Fun']">TBC</span>
                                    </div>
                                )} */}
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col border-l border-r border-gray-100 w-[25%]'
                        style={getStyle("No-result", 1)}>
                        <div className={`w-full h-[30%] flex font-bold items-center justify-center text-[0.9vw] ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedDate}</div>
                        <div className="w-full h-2/5 flex items-center justify-center text-[1.3vw] font-['Reem_Kufi_Fun'] font-medium tracking-wide opacity-80 uppercase text-center px-2">VS</div>
                        <div className={`w-full h-[30%] flex items-center justify-center text-[0.75vw] ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>{formattedTime} your time</div>
                    </div>
                    <div className='flex flex-row w-[37.5%] font-["Reem_Kufi_Fun"] uppercase'
                        style={getStyle('Away-win', 2)}>

                        <div className={`w-[36%] flex justify-center items-center ${category === "franchise" ? "p-5" : "p-6"}`}>
                            <div className="relative w-full">
                                <img className={`box-content w-full ${category === "franchise" ? "" : "border border-zinc-200"}`} style={{ filter: awayConfirmed === false && awayTeamLogo !== "" ? 'blur(4px)' : 'none' }} src={awayTeamLogo ? awayTeamLogo : "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14"} alt={`${awayTeamName} Logo`}></img>
                                {/* {!awayConfirmed && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-[2.5vh] font-['Reem_Kufi_Fun']">TBC</span>
                                    </div>
                                )} */}
                            </div>
                        </div>

                        <div className="flex items-center text-[2vh] w-1/5 justify-start">
                            {awayConfirmed ? awayTeamName : awaySeed}
                        </div>

                        <div className="font-['Reem_Kufi_Fun'] text-center flex flex-col justify-center text-[2vh] items-start w-2/5">
                            {matchResult !== "None" && <div className="flex justify-start items-center font-['Reem_Kufi_Fun'] rounded text-left h-1/5 mb-1">
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent w-[35%] h-full text-[2.5vh] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    step="1"
                                    value={awayTeamRuns || ''}
                                    readOnly
                                    style={{ color: matchResult === "Away-win" ? "white" : "black" }} />
                                <h2>/</h2>
                                <input className="font-['Reem_Kufi_Fun'] rounded border border-gray-300 bg-transparent text-[2.5vh] w-1/5 h-full ml-0.5 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={awayTeamWickets || ''}
                                    readOnly
                                    style={{ color: matchResult === "Away-win" ? "white" : "black" }} />
                            </div>}
                            {matchResult !== "None" && <div className="flex justify-start">
                                <input className="border border-gray-300 text-[1.75vh] rounded bg-transparent font-['Reem_Kufi_Fun'] text-center w-[90%] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    type={"number"}
                                    min="0.0"
                                    max="20.0"
                                    step="0.1"
                                    value={awayTeamOvers || ''}
                                    readOnly
                                    style={{ color: matchResult === "Away-win" ? "white" : "black" }} />
                            </div>}
                        </div>

                    </div>
                </div>
                <div className="border-t border-gray-100 h-8 flex flex-row items-center justify-between bg-white text-[0.9vw]">
                    <div className={`flex justify-center items-center h-full flex-grow text-black ${matchResult !== 'None' ? 'opacity-50' : 'opacity-100'}`}>
                        {group ? `${stage} · Group ${group} · Match ${matchNum} · ${venue}, ${city}` : `${stage} · Match ${matchNum} · ${venue}, ${city}`}
                    </div>

                </div>
            </div>
        </div>
    )
        ;
}

export default MatchResultCard;