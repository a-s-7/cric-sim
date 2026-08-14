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
};

export default MATCHES_ENDPOINTS;