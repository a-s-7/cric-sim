import React from "react";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import T20LeagueMatchCard from "./T20League/T20LeagueMatchCard";
import T20LeagueMatchResultCard from "./T20League/T20LeagueMatchResultCard";
import MatchCard from "./MatchCard";
import MatchResultCard from "./MatchResultCard";


function EventMatchDisplay({ onMatchUpdate, matches, cardNeutralGradient }) {

    const matchesArray = matches?.matches || [];
    const teamDictionary = matches?.teams?.[0] || {};
    const tournamentDictionary = matches?.tournament?.[0] || {};

    return (
        <div className="flex flex-col">
            <h3 className={`text-3xl font-bold tracking-tight text-black font-['Kanit'] p-4`}>MATCHES</h3>
            <div className="flex flex-col gap-[20px] px-4">
                {matchesArray && matchesArray.map(match => (
                    <div key={`${match.matchNumber}`}>
                        {(match.awayConfirmed == false || match.homeConfirmed == false) ? <MatchResultCard
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
                            leagueName={tournamentDictionary?.name}
                            edition={tournamentDictionary?.edition}
                            matchNum={match.matchNumber}
                            venue={match.venue}
                            date={match.date}
                            matchResult={match.result}
                            homeTeamRuns={match.homeTeamRuns}
                            homeTeamWickets={match.homeTeamWickets}
                            homeTeamOvers={match.homeTeamOvers}
                            awayTeamRuns={match.awayTeamRuns}
                            awayTeamWickets={match.awayTeamWickets}
                            awayTeamOvers={match.awayTeamOvers}
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
                            leagueName={tournamentDictionary?.name}
                            leagueID={tournamentDictionary?._id}
                            edition={tournamentDictionary?.edition}
                            matchNum={match.matchNumber}
                            venue={match.venue}
                            date={match.date}
                            matchResult={match.result}
                            onMatchUpdate={onMatchUpdate}
                            homeTeamRuns={match.homeTeamRuns}
                            homeTeamWickets={match.homeTeamWickets}
                            homeTeamOvers={match.homeTeamOvers}
                            awayTeamRuns={match.awayTeamRuns}
                            awayTeamWickets={match.awayTeamWickets}
                            awayTeamOvers={match.awayTeamOvers}
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