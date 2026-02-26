import MatchCard from "./MatchCard";
import MatchResultCard from "./MatchResultCard";


function EventMatchDisplay({ onMatchUpdate, matches, cardNeutralGradient, tournamentId, tournamentName, tournamentEdition }) {

    const matchesArray = matches?.matches || [];
    const teamDictionary = matches?.teams?.[0] || {};

    const convertBallsToDecimalOvers = (balls) => {
        const overs = Math.floor(balls / 6);
        const remainingBalls = balls % 6;
        return parseFloat(`${overs}.${remainingBalls}`);
    }

    return (
        <div className="w-full h-full flex flex-col font-['Nunito_Sans']">
            <div className="flex flex-row items-center justify-between px-4 h-16">
                <h3 className={`text-3xl font-bold tracking-tight text-black font-['Kanit']`}>MATCHES</h3>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">

                <div className="flex-1 flex flex-col gap-8 px-4 pt-0 pb-2 overflow-y-auto no-scrollbar mt-2">
                    {matchesArray && matchesArray.map(match => (
                        <div key={`${match.matchNumber}`}>
                            {(match.stageStatus === "locked") ? <MatchResultCard
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