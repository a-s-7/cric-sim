const MATCHES_ENDPOINTS = {
    updateResult: (tournamentId, matchNum, result) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/result/${result}`,
    simulate: (tournamentId) =>
        `/api/tournaments/${tournamentId}/matches/simulate`,
    clear: (tournamentId) =>
        `/api/tournaments/${tournamentId}/matches/clear`,
    tossResult: (tournamentId, matchNum, tossResult) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/toss-result/${tossResult}`,
    tossDecision: (tournamentId, matchNum, tossDecision) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/toss-decision/${tossDecision}`,
    status: (tournamentId, matchNum, status) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/status/${status}`,
    abandon: (tournamentId, matchNum) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/abandon`,
    score: (tournamentId, matchNum) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/score`,
    target: (tournamentId, matchNum, targetRuns = null) =>
        targetRuns === null
            ? `/api/tournaments/${tournamentId}/matches/${matchNum}/target`
            : `/api/tournaments/${tournamentId}/matches/${matchNum}/target/${targetRuns}`,
    targetOvertaken: (tournamentId, matchNum, targetOvertaken) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/target-overtaken/${targetOvertaken}`,
    maxBalls: (tournamentId, matchNum) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/max-balls`,
};

export default MATCHES_ENDPOINTS;