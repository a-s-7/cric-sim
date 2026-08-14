const TOURNAMENT_ENDPOINTS = {
    tournaments: '/api/tournaments',
    tournamentInfo: (tournamentBaseId) => `/api/tournaments/${tournamentBaseId}/info`,
    tournamentTeams: (tournamentId) => `/api/tournaments/${tournamentId}/teams`,
    tournamentVenues: (tournamentId) => `/api/tournaments/${tournamentId}/venues`,
    tournamentGroups: (tournamentId) => `/api/tournaments/${tournamentId}/groups`,
    tournamentStages: (tournamentId) => `/api/tournaments/${tournamentId}/stages`,
    tournamentMatches: (tournamentId) => `/api/tournaments/${tournamentId}/matches`,
    tournamentStandings: (tournamentId) => `/api/tournaments/${tournamentId}/standings`,
};

export default TOURNAMENT_ENDPOINTS;