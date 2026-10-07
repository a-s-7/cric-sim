import React from "react";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PreseededTeamIdentity from "./PreseededTeamIdentity";

const PLACEHOLDER_TEAM_LOGO = "https://assets-icc.sportz.io/static-assets/buildv3-stg/images/teams/0.png?v=14";

function getPreseedOrder(team) {
    const seed = team.seed || "";

    // Multi-letter display seeds (such as AB4) can map to a normal bracket slot (B4).
    const hasMultipleSeedLetters = /^[A-Za-z]{2,}\d+$/.test(seed);
    if (!hasMultipleSeedLetters) return seed;

    // Use the mapped slot for sorting so the display seed stays in its bracket position.
    return team.seedToGroupMapping || seed;
}

function getPreseededOutcome(team) {
    if (team.confirmed !== true) {
        return "Pending";
    }

    if (!team.preseededTeamId) {
        return "Qualified";
    }

    if (team.teamId === team.preseededTeamId) {
        return "Kept";
    }

    return "Replaced";
}

function buildPreseededStage(stage, standingsData) {
    const stageTeams = Object.values(stage.groups || {}).flat();

    // Look up teams across stages so both original and qualifying teams can show their details.
    const allTeams = standingsData.flatMap(standingsStage =>
        Object.values(standingsStage.groups || {}).flat()
    );
    const teamById = new Map();
    for (const team of allTeams) {
        if (team.teamId) {
            teamById.set(team.teamId, team);
        }
    }

    // Keep only rows with a seed, then sort them by their bracket position.
    const seededTeams = [];
    for (const team of stageTeams) {
        const hasSeed = team.preseededTeamId || team.seedToGroupMapping || team.seed;
        if (hasSeed) {
            seededTeams.push(team);
        }
    }

    seededTeams.sort((firstTeam, secondTeam) => {
        const firstSeed = getPreseedOrder(firstTeam);
        const secondSeed = getPreseedOrder(secondTeam);
        return firstSeed.localeCompare(secondSeed, undefined, { numeric: true });
    });

    // Build the details shown in each row of the pane.
    const slots = [];
    for (const team of seededTeams) {
        const originalTeam = teamById.get(team.preseededTeamId);

        let displayTeamId = team.teamId || team.preseededTeamId;
        if (!displayTeamId && team.seed?.startsWith("Q-")) {
            displayTeamId = team.seed;
        }
        if (!displayTeamId) {
            displayTeamId = "TBC";
        }

        let displayTeam = team;
        if (originalTeam) {
            displayTeam = originalTeam;
        }

        const qualifiedTeam = teamById.get(displayTeamId);
        if (qualifiedTeam) {
            displayTeam = qualifiedTeam;
        }

        slots.push({
            slot: team.seed || team.seedToGroupMapping || "Seed",
            teamId: displayTeamId,
            teamName: displayTeam.name,
            teamLogo: displayTeam.logo || PLACEHOLDER_TEAM_LOGO,
            preseededTeamId: team.preseededTeamId,
            preseededTeamName: originalTeam?.name,
            preseededTeamLogo: originalTeam?.logo || PLACEHOLDER_TEAM_LOGO,
            outcome: getPreseededOutcome(team),
        });
    }

    return {
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        slots,
    };
}

function QualificationPicturePane({ stage, standingsData, color, isActive, isOpen, onToggle, onClose }) {
    const preseedInfo = buildPreseededStage(stage, standingsData);

    return (
        <>
            <button
                type="button"
                onClick={onToggle}
                title={`Preseed outcomes for ${stage.stageName}`}
                className={`z-20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${isActive
                    ? "text-white/90 hover:bg-white/20 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                    }`}
            >
                <span className="flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-current">
                    <FontAwesomeIcon icon={faInfo} className="h-[9px] w-[9px]" />
                </span>
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    className="absolute right-0 top-11 z-30 max-h-[60vh] w-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 font-['Nunito_Sans'] text-sm shadow-xl"
                >
                    <div className="mb-2 flex items-start justify-between gap-3 border-b border-zinc-100 pb-2">
                        <div className="min-w-0">
                            <h4 className="truncate text-[13px] font-['Reem_Kufi'] font-extrabold uppercase tracking-wide text-zinc-900">
                                {stage.stageName} Qualification Picture
                            </h4>
                            <p className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-zinc-500">
                                Preseeded and qualifying teams
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 self-start rounded px-2 py-1 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                            ×
                        </button>
                    </div>

                    <div className="mb-1 grid grid-cols-[3.25rem_minmax(0,1fr)_6rem_minmax(0,1fr)] font-['Reem_Kufi'] items-center gap-2 text-center text-[8px] font-extrabold uppercase tracking-[0.08em] text-zinc-600">
                        <span>Seed</span>
                        <span>Preseeded</span>
                        <span>Status</span>
                        <span>Qualified</span>
                    </div>

                    <ul className="divide-y divide-zinc-100">
                        {preseedInfo.slots.map(slot => (
                            <li
                                key={`${stage.stageOrder}-${slot.slot}`}
                                className="grid grid-cols-[3.25rem_minmax(0,1fr)_6rem_minmax(0,1fr)] items-center gap-2 py-2 text-xs"
                            >
                                <span
                                    className="inline-flex min-w-8 justify-center rounded-md border-l-[3px] bg-zinc-100 px-1.5 py-1 font-['Reem_Kufi'] font-extrabold text-zinc-700"
                                    style={{ borderLeftColor: color || "#52525b" }}
                                >
                                    {slot.slot}
                                </span>

                                {slot.preseededTeamId ? (
                                    <PreseededTeamIdentity
                                        teamId={slot.preseededTeamId}
                                        name={slot.preseededTeamName}
                                        logo={slot.preseededTeamLogo}
                                        muted={slot.outcome === "Replaced"}
                                    />
                                ) : (
                                    <span />
                                )}

                                <div className="flex w-24 items-center">
                                    {(slot.outcome === "Kept" || slot.outcome === "Qualified") && (
                                        <span className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-emerald-50 px-1 py-1 text-[9px] font-bold uppercase text-emerald-700">
                                            Qualified
                                        </span>
                                    )}
                                    {slot.outcome === "Replaced" && (
                                        <span className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-red-50 px-1 py-1 text-[9px] font-bold uppercase text-red-700">
                                            Replaced by
                                        </span>
                                    )}
                                    {slot.outcome === "Pending" && (
                                        <span className="flex w-full items-center justify-center whitespace-nowrap rounded-full bg-zinc-100 px-1 py-1 text-[9px] font-semibold uppercase text-zinc-500">
                                            Pending
                                        </span>
                                    )}
                                </div>

                                {slot.outcome === "Pending" ? (
                                    <span className="flex justify-center text-zinc-300">—</span>
                                ) : (
                                    <PreseededTeamIdentity
                                        teamId={slot.teamId}
                                        name={slot.teamName}
                                        logo={slot.teamLogo}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}

export default QualificationPicturePane;
