const MATCHES_ENDPOINTS = {
    updateResult: (tournamentId, matchNum, result) =>
        `/api/tournaments/${tournamentId}/matches/${matchNum}/result/${result}`,
    simulate: (tournamentId) =>
        `/api/tournaments/${tournamentId}/matches/simulate`,
};

export default MATCHES_ENDPOINTS;