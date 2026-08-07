import React from "react";
import MatchCard from "./MatchCard";
import MatchCardDisplay from "./MatchCardDisplay";

function WTCMatchCardPanel({ onMatchUpdate, matches, cycle, urlTag }) {
    const [teamData = {}, seriesData = {}, matchData = []] = matches;

    return (
        matchData.map(match => (
            <div key={`${match.seriesID}-${match.matchNumber.charAt(0)}`}>
                {match.status === "incomplete" ? (
                    <MatchCard
                        homeGradient={teamData[match.homeTeam].gradient}
                        awayGradient={teamData[match.awayTeam].gradient}
                        homeTeamName={match.homeTeam}
                        homeTeamFlag={teamData[match.homeTeam].flag}
                        awayTeamName={match.awayTeam}
                        awayTeamFlag={teamData[match.awayTeam].flag}
                        seriesName={seriesData[match.seriesID]}
                        testNum={match.matchNumber}
                        venue={match.location}
                        dateRange={match.dateRange}
                        time={match.startTime}
                        seriesId={match.seriesID}
                        matchResult={match.result}
                        onMatchUpdate={onMatchUpdate}
                        homeDeduction={match.homeDed}
                        awayDeduction={match.awayDed}
                        cycle={cycle}
                        urlTag={urlTag}
                    />
                ) : (
                    <MatchCardDisplay
                        homeGradient={teamData[match.homeTeam].gradient}
                        awayGradient={teamData[match.awayTeam].gradient}
                        homeTeamName={match.homeTeam}
                        homeTeamFlag={teamData[match.homeTeam].flag}
                        awayTeamName={match.awayTeam}
                        awayTeamFlag={teamData[match.awayTeam].flag}
                        seriesName={seriesData[match.seriesID]}
                        testNum={match.matchNumber}
                        venue={match.location}
                        dateRange={match.dateRange}
                        time={match.startTime}
                        matchResult={match.result}
                        homeDeduction={match.homeDed}
                        awayDeduction={match.awayDed} />
                )}
            </div>
        ))
    );
}

export default WTCMatchCardPanel;