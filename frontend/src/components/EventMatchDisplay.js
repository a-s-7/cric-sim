import MatchCard from "./MatchCard";
import MatchResultCard from "./MatchResultCard";


function EventMatchDisplay({ onMatchUpdate, matches, cardNeutralGradient, tournamentId, tournamentName, tournamentEdition }) {

    const matchesArray = matches?.matches || [];
    const teamDictionary = matches?.teams?.[0] || {};
    const winner = matches?.winner || "";
    const format = matches?.format || "";
    const category = matches?.category || "";

    const convertBallsToDecimalOvers = (balls) => {
        const overs = Math.floor(balls / 6);
        const remainingBalls = balls % 6;
        return parseFloat(`${overs}.${remainingBalls}`);
    }

    return (
        <div className="w-full h-full flex flex-col font-['Nunito_Sans']">


            <div className={`relative flex flex-row items-center justify-between h-16 overflow-hidden transition-all duration-500 rounded-2xl mx-2`} style={winner ? { padding: "16px" } : {}}>
                <h3 className={`relative z-10 text-3xl font-bold text-black font-['Kanit'] uppercase drop-shadow-md`} style={winner ? { color: "white" } : {}}>
                    MATCHES
                </h3>

                {winner && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-[100%] transition-opacity duration-1000"
                        style={{
                            background: winner.includes("#")
                                ? `linear-gradient(to right, ${teamDictionary[winner.split("#")[0]]?.gradient?.split(',')[1]?.split(')')[0] || "#333"}, ${teamDictionary[winner.split("#")[1]]?.gradient?.split(',')[1]?.split(')')[0] || "#666"})`
                                : teamDictionary[winner]?.gradient
                        }}
                    />
                )}

                {winner && (
                    <div className="relative z-10 flex flex-row items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-black tracking-[0.4em] text-white/80 leading-none mb-1 drop-shadow-sm">
                                {winner.includes("#") ? "Joint Champions" : "Champions"}
                            </span>
                            <div className="flex flex-row items-center gap-2">
                                {winner.split("#").map((w, index, arr) => (
                                    <h3 key={w} className={`${arr.length > 1 ? "text-lg" : "text-2xl"} font-black tracking-widest text-white font-['Kanit'] uppercase leading-none drop-shadow-xl flex items-center`}>
                                        {teamDictionary[w]?.name || w}
                                        {index === 0 && arr.length > 1 && <span className="mx-2 text-white/50 text-xs">&</span>}
                                    </h3>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-4">
                            {winner.split("#").map((w) => (
                                <img
                                    key={w}
                                    src={teamDictionary[w]?.logo}
                                    alt={teamDictionary[w]?.name}
                                    className="w-12 h-12 object-contain drop-shadow-lg"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">

                <div className="flex-1 flex flex-col gap-8 px-2 pt-0 pb-2 overflow-y-auto no-scrollbar mt-2">
                    {matchesArray && matchesArray.map(match => (
                        <div key={`${match.matchNumber}`}>
                            {(match.stageStatus === "locked" ? true : match.stage === "Playoffs" || match.stage === "Final" ? match.awayStageTeam && match.homeStageTeam ? false : true : false) ? <MatchResultCard
                                homeGradient={match.homeStageTeam ? teamDictionary[match.homeStageTeam]?.gradient : ""}
                                awayGradient={match.awayStageTeam ? teamDictionary[match.awayStageTeam]?.gradient : ""}
                                homeTeamName={match.homeStageTeam}
                                awayTeamName={match.awayStageTeam}
                                homeTeamLogo={match.homeStageTeam ? teamDictionary[match.homeStageTeam]?.logo : ""}
                                awayTeamLogo={match.awayStageTeam ? teamDictionary[match.awayStageTeam]?.logo : ""}
                                homeSeed={match.homeSeed}
                                awaySeed={match.awaySeed}
                                homeConfirmed={match.homeConfirmed}
                                awayConfirmed={match.awayConfirmed}
                                tournamentName={tournamentName}
                                tournamentEdition={tournamentEdition}
                                matchNum={match.matchNumber}
                                venue={match.venue}
                                date={match.date}
                                matchResult={match.result}
                                homeTeamRuns={match.homeTeamRuns}
                                homeTeamWickets={match.homeTeamWickets}
                                homeTeamOvers={convertBallsToDecimalOvers(match.homeTeamBalls)}
                                awayTeamRuns={match.awayTeamRuns}
                                awayTeamWickets={match.awayTeamWickets}
                                awayTeamOvers={convertBallsToDecimalOvers(match.awayTeamBalls)}
                                neutralGradient={cardNeutralGradient}
                                group={match.group}
                                stage={match.description ? match.description : match.stage}
                                city={match.city}
                                category={category}
                            /> : <MatchCard
                                homeGradient={teamDictionary[match.homeStageTeam]?.gradient}
                                awayGradient={teamDictionary[match.awayStageTeam]?.gradient}
                                homeTeamName={match.homeStageTeam}
                                awayTeamName={match.awayStageTeam}
                                homeTeamLogo={teamDictionary[match.homeStageTeam]?.logo}
                                awayTeamLogo={teamDictionary[match.awayStageTeam]?.logo}
                                tournamentName={tournamentName}
                                tournamentID={tournamentId}
                                tournamentEdition={tournamentEdition}
                                matchNum={match.matchNumber}
                                venue={match.venue}
                                date={match.date}
                                matchResult={match.result}
                                onMatchUpdate={onMatchUpdate}
                                homeTeamRuns={match.homeTeamRuns}
                                homeTeamWickets={match.homeTeamWickets}
                                homeTeamOvers={convertBallsToDecimalOvers(match.homeTeamBalls)}
                                awayTeamRuns={match.awayTeamRuns}
                                awayTeamWickets={match.awayTeamWickets}
                                awayTeamOvers={convertBallsToDecimalOvers(match.awayTeamBalls)}
                                neutralGradient={cardNeutralGradient}
                                group={match.group}
                                stage={match.description ? match.description : match.stage}
                                tossResult={match.tossResult}
                                tossDecision={match.tossDecision}
                                city={match.city}
                                format={format}
                                category={category}
                            />
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EventMatchDisplay;