export function getTournamentLogoStyles(tournamentName) {
    const exactName = tournamentName || "";

    if (exactName === "European T20 Premier League") {
        return {
            scaleClass: "scale-[0.75]",
            paddingClass: "p-3",
        };
    }

    return {
        scaleClass: "",
        paddingClass: "p-4",
    };
}
