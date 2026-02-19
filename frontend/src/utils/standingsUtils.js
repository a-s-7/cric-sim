/**
 * This function calculates how many positions each team moved up or down.
 * It compares the 'fresh' standings from the server with the 'previous' standings we had.
 * 
 * Why? So we can show little green "up" arrows or red "down" arrows in the UI.
 * 
 * @param {Array} previousStandings - The standing data we already had in state.
 * @param {Array} freshStandings - The new standing data just fetched from the API.
 * @returns {Array} - The new standings, but with a 'diff' property added to every team.
 */
export function calculateStandingsMovement(previousStandings, freshStandings) {
    const updatedStandings = [];

    // 1. Loop through each stage of the tournament (e.g. "Group Stage", "Super 8s")
    for (let i = 0; i < freshStandings.length; i++) {
        const freshStage = freshStandings[i];

        // Find the matching stage from our previous data (if it exists)
        const previousStage = (previousStandings && previousStandings[i]) ? previousStandings[i] : null;

        const updatedGroups = {};

        // 2. Loop through each group in this stage (e.g. "Group A", "Group B")
        for (const groupName in freshStage.groups) {
            const freshTeams = freshStage.groups[groupName];
            const previousTeams = (previousStage && previousStage.groups) ? previousStage.groups[groupName] : [];

            // 3. To compare positions, we need to know where each team was "last time".
            // We'll create a simple "lookup" object: { "India": 0, "Australia": 1, ... }
            const lastRankLookup = {};
            for (let rank = 0; rank < previousTeams.length; rank++) {
                const team = previousTeams[rank];
                lastRankLookup[team.name] = rank;
            }

            // 4. Now, look at each team's new position and calculate the difference.
            const teamsWithMovement = [];
            for (let currentRank = 0; currentRank < freshTeams.length; currentRank++) {
                const team = freshTeams[currentRank];
                const previousRank = lastRankLookup[team.name];

                let movement = 0;
                // If the team was in our previous list, we calculate: (Old Rank - New Rank)
                // Example: If a team was rank 5 and is now rank 2, they moved +3 spots!
                if (previousRank !== undefined) {
                    movement = previousRank - currentRank;
                }

                // Keep all the team's data, but add our new 'diff' number
                teamsWithMovement.push({
                    ...team,
                    diff: movement
                });
            }

            // Save these teams back into the group
            updatedGroups[groupName] = teamsWithMovement;
        }

        // 5. Add this stage (with the updated groups) to our final result list
        updatedStandings.push({
            ...freshStage,
            groups: updatedGroups
        });
    }

    return updatedStandings;
}
