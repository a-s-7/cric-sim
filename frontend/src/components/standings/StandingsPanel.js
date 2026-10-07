import React, { useEffect, useState } from "react";
import PointsTable from "./PointsTable";
import QualificationPicturePane from "./QualificationPicturePane";

function isBetterNextBestCandidate(candidate, currentBest) {
    // Points decide first. Wins and net run rate only matter when points are tied.
    const candidatePoints = candidate.team.points || 0;
    const bestPoints = currentBest.team.points || 0;
    if (candidatePoints !== bestPoints) {
        return candidatePoints > bestPoints;
    }

    const candidateWins = candidate.team.won || 0;
    const bestWins = currentBest.team.won || 0;
    if (candidateWins !== bestWins) {
        return candidateWins > bestWins;
    }

    const candidateRunRate = candidate.team.netRunRate || 0;
    const bestRunRate = currentBest.team.netRunRate || 0;
    if (candidateRunRate !== bestRunRate) {
        return candidateRunRate > bestRunRate;
    }

    // Group B ranks ahead of Group A.
    return candidate.group.localeCompare(currentBest.group) > 0;
}

function getNextBestTeamId(stage) {
    // This stage has no next-best qualifier, so there is nothing to highlight.
    if (!stage.nextBestTeam) {
        return null;
    }

    // The qualifier count is also the zero-based index of the next team in each group.
    const candidateIndex = stage.numQualifiers;
    let bestCandidate = null;

    // Check the team at that position in every group.
    for (const [group, teams] of Object.entries(stage.groups || {})) {
        const team = teams[candidateIndex];
        if (!team) {
            continue;
        }

        const candidate = { group, team };

        // Start with the first available candidate.
        if (bestCandidate === null) {
            bestCandidate = candidate;
            continue;
        }

        // Keep this candidate only if it ranks above the current best.
        if (isBetterNextBestCandidate(candidate, bestCandidate)) {
            bestCandidate = candidate;
        }
    }

    // No team is returned when no group has a team below its qualifier cutoff.
    return bestCandidate ? bestCandidate.team.teamId : null;
}

function StandingsPanel({ standingsData, category, color, format }) {
    function getFarthestActiveIndex(stages) {
        let farthest = 0;

        stages.forEach((stage, index) => {
            if (stage.stageStatus === "active") {
                farthest = index;
            }
        });

        return farthest;
    }

    const [activeStage, setActiveStage] = React.useState(() =>
        getFarthestActiveIndex(standingsData || [])
    );
    const [openPreseedStageOrder, setOpenPreseedStageOrder] = useState(null);

    useEffect(() => {
        setActiveStage(getFarthestActiveIndex(standingsData || []));
    }, [standingsData]);

    if (!standingsData || !standingsData.length) return null;

    const safeActiveStage = standingsData[activeStage] ? activeStage : Math.max(0, standingsData.length - 1);
    const activeStageData = standingsData[safeActiveStage];
    const nextBestTeamId = getNextBestTeamId(activeStageData);

    return (
        <div className="w-full h-full flex flex-col font-['Nunito_Sans']">
            {/* Stage Selector Toggle */}
            <div className="flex flex-row items-center justify-between px-2 h-16">
                <h3 className={`text-2xl font-bold tracking-tight text-black font-['Reem_Kufi']`}>STANDINGS</h3>


                {standingsData.length > 1 ? (
                    <div className="relative flex h-11 w-[65%] items-center rounded-full border border-zinc-200 bg-zinc-100/50 p-1 shadow-inner">
                        {/* Sliding Background - Pill Style */}
                        <div
                            className="absolute rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{
                                width: `calc((100% - 8px) / ${standingsData.length})`,
                                left: `calc(4px + ${safeActiveStage} * (100% - 8px) / ${standingsData.length})`,
                                height: 'calc(100% - 8px)',
                                background: color || '#000',
                            }}
                        />
                        {standingsData.map((stage, index) => {
                            const isActive = safeActiveStage === index;
                            const isPictureOpen = openPreseedStageOrder === stage.stageOrder;
                            const hasPreseededTeams = stage.hasPreseededTeams;

                            return (
                                <div key={stage.stageOrder} className="relative z-10 flex h-full min-w-0 flex-1 items-center justify-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveStage(index);
                                            setOpenPreseedStageOrder(null);
                                        }}
                                        className={`h-full min-w-0 shrink truncate px-1 text-center text-[12px] font-bold uppercase tracking-widest transition-colors duration-300 font-['Reem_Kufi_Fun'] ${isActive
                                            ? "text-white"
                                            : "text-zinc-500 hover:text-zinc-800"
                                            }`}
                                    >
                                        {stage.stageName}
                                    </button>

                                    {hasPreseededTeams && (
                                        <QualificationPicturePane
                                            stage={stage}
                                            standingsData={standingsData}
                                            color={color}
                                            isActive={isActive}
                                            isOpen={isPictureOpen}
                                            onToggle={() => setOpenPreseedStageOrder(isPictureOpen ? null : stage.stageOrder)}
                                            onClose={() => setOpenPreseedStageOrder(null)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : activeStageData.hasPreseededTeams ? (
                    <div className="relative flex items-center">
                        <QualificationPicturePane
                            stage={activeStageData}
                            standingsData={standingsData}
                            color={color}
                            isActive
                            isOpen={openPreseedStageOrder === activeStageData.stageOrder}
                            onToggle={() => setOpenPreseedStageOrder(
                                openPreseedStageOrder === activeStageData.stageOrder
                                    ? null
                                    : activeStageData.stageOrder
                            )}
                            onClose={() => setOpenPreseedStageOrder(null)}
                        />
                    </div>
                ) : null}
            </div>

            {/* Main Standings Container */}
            <div className="flex-1 flex flex-col bg-white rounded-[10px] border border-zinc-200 shadow-xl overflow-hidden mx-2 mb-2 mt-2 bg-red-500">
                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {Object.entries(activeStageData.groups).map(([groupName, teams], _, array) => (
                        <div className={`flex flex-col gap-2 w-full ${array.length === 1 ? 'flex-1' : ''} ${groupName === "LEAGUE" ? '' : 'p-4'}`} key={groupName}>
                            {groupName !== "LEAGUE" && <h3 className={`text-xl font-bold tracking-tight text-black font-['Reem_Kufi']`}>GROUP&nbsp;&nbsp;{groupName}</h3>}

                            <div className={array.length === 1 ? "flex-1 h-full" : ""}>
                                <PointsTable
                                    pointsTableTeamsData={teams}
                                    headerColor={color}
                                    topQualifiers={activeStageData.numQualifiers}
                                    nextBestTeamId={nextBestTeamId}
                                    isSingleTable={array.length === 1}
                                    category={category}
                                    format={format}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StandingsPanel;
