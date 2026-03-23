import React, { useEffect } from "react";
import PointsTable from "./PointsTable";


function EventStandings({ standingsData, color }) {
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

    useEffect(() => {
        setActiveStage(getFarthestActiveIndex(standingsData || []));
    }, [standingsData]);

    if (!standingsData || !standingsData.length) return null;

    return (
        <div className="w-full h-full flex flex-col font-['Nunito_Sans']">
            {/* Stage Selector Toggle */}
            <div className="flex flex-row items-center justify-between px-2 h-16">
                <h3 className={`text-3xl font-bold tracking-tight text-black font-['Kanit']`}>STANDINGS</h3>


                <div className="relative flex rounded-full w-[65%] border border-zinc-200 shadow-inner bg-zinc-100/50 h-11 p-1 items-center">
                    {/* Sliding Background - Pill Style */}
                    <div
                        className="absolute transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-full shadow-md"
                        style={{
                            width: `calc((100% - 8px) / ${standingsData.length})`,
                            left: `calc(4px + ${activeStage} * (100% - 8px) / ${standingsData.length})`,
                            height: 'calc(100% - 8px)',
                            background: color || '#000',
                        }}
                    />
                    {standingsData.map((stage, index) => (
                        <button
                            key={stage.stageOrder}
                            onClick={() => setActiveStage(index)}
                            className={`relative z-10 flex-1 h-full text-[12px] font-bold uppercase tracking-widest transition-colors duration-300 font-['Reem_Kufi_Fun'] ${activeStage === index
                                ? "text-white"
                                : "text-zinc-500 hover:text-zinc-800"
                                }`}
                        >
                            {stage.stageName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Standings Container */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden mx-2 mb-2 mt-2">
                {/* Content Area */}
                <div className="flex-1 flex flex-col gap-8 p-4 overflow-y-auto no-scrollbar">
                    {Object.entries(standingsData[activeStage].groups).map(([groupName, teams]) => (
                        <div className="flex flex-col gap-2" key={groupName}>
                            <h3 className={`text-2xl font-bold tracking-tight text-black font-['Kanit']`}>GROUP {groupName}</h3>

                            <PointsTable pointsTableTeamsData={teams} headerColor={color} topQualifiers={standingsData[activeStage].numQualifiers} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EventStandings;