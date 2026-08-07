import React from "react";

function MatchCardDisplay({
    homeGradient, awayGradient, homeTeamName, homeTeamFlag, awayTeamName, awayTeamFlag,
    seriesName, testNum, venue, dateRange, time, matchResult,
    homeDeduction, awayDeduction
}) {
    const neutralGradient = 'linear-gradient(135deg, black, black, silver)';


    const getStyle = (section, num) => {
        let background = 'transparent';
        let color = 'black';
        const gradients = [homeGradient, neutralGradient, awayGradient];

        background = matchResult === section ? gradients[num] : 'whitesmoke';
        color = matchResult === section ? 'white' : 'black';

        return {
            background: background,
            color: color
        };
    }


    return (
        <div className="matchCardBody">
            <div className="body">
                <div className="mainBody">
                    <div className='homeTeam'
                        style={getStyle("Home-win", 0)}>
                        <div className="homeName">
                            {homeTeamName}
                        </div>
                        <div className="homeFlag">
                            <img src={homeTeamFlag} alt={`Flag of ${homeTeamName}`}></img>
                        </div>
                    </div>
                    <div className='neutral'
                        style={getStyle("Draw", 1)}>
                        <div className="date">{dateRange}</div>
                        <div className="vs">VS</div>
                        <div className="time">{time + " your time"}</div>
                    </div>
                    <div className='awayTeam'
                        style={getStyle("Away-win", 2)}>
                        <div className="awayFlag">
                            <img src={awayTeamFlag} alt={`Flag of ${awayTeamName}`}></img>
                        </div>
                        <div className="awayName">
                            {awayTeamName}
                        </div>
                    </div>
                </div>
                <div className="infoBody">
                    <div className="homeDed">
                        <input type="number"
                            placeholder={homeDeduction === 0 ? "" : homeDeduction}
                            value={homeDeduction === 0 ? "" : homeDeduction}
                            min="0"
                        />
                    </div>
                    <div className="matchInfo">
                        {seriesName + " · " + testNum + " · " + venue}
                    </div>
                    <div className="awayDed">
                        <input type="number"
                            placeholder={awayDeduction === 0 ? "" : awayDeduction}
                            value={awayDeduction === 0 ? "" : awayDeduction}
                            min="0"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MatchCardDisplay