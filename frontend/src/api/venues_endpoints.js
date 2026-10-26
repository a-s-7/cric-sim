const VENUE_ENDPOINTS = {
    venues: '/api/venues',
    update: (venueId) => `/api/venues/${encodeURIComponent(venueId)}`,
};

export default VENUE_ENDPOINTS;

