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
        <div className="flex flex-col">
            <h3 className={`text-3xl font-bold tracking-tight text-black font-['Kanit'] p-4`}>MATCHES</h3>
            <div className="flex flex-col gap-[20px] px-4">
                {matchesArray && matchesArray.map(match => (
                    <div key={`${match.matchNumber}`}>
                        {(match.stageStatus === "locked") ? <MatchResultCard
                            homeGradient={teamDictionary[match.homeStageTeam]?.gradient}
                            awayGradient={teamDictionary[match.awayStageTeam]?.gradient}
                            homeTeamName={match.homeStageTeam}
                            awayTeamName={match.awayStageTeam}
                            homeTeamLogo={teamDictionary[match.homeStageTeam]?.logo}
                            awayTeamLogo={teamDictionary[match.awayStageTeam]?.logo}
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
                            stage={match.stage}
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
                            stage={match.stage}
                        />
                        }
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventMatchDisplay;