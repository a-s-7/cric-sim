const TOURNAMENT_ENDPOINTS = {
    tournaments: '/api/tournaments',
    tournamentInfo: (tournamentBaseId) => `/api/tournaments/${tournamentBaseId}/info`,
};

export default TOURNAMENT_ENDPOINTS;