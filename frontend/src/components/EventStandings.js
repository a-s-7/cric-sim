import React from "react";
import PointsTable from "./PointsTable";

function EventStandings({ standingsData, color }) {
    const [activeStage, setActiveStage] = React.useState(0);

    if (!standingsData || !standingsData.length) return null;

    return (
        <div className="w-full h-full flex flex-col p-2 gap-4 font-['Nunito_Sans']">
            {/* Stage Selector Toggle */}
            <div className="flex flex-row">
                {/* <div className="text-2xl font-bold tracking-tight text-zinc-800">
                    STANDINGS
                </div> */}

                <div className="flex rounded-xl p-1 w-full border border-zinc-200 shadow-inner">
                    {standingsData.map((stage, index) => (
                        <button
                            key={stage.stageOrder}
                            onClick={() => setActiveStage(index)}
                            className={`flex-1 py-2 px-4 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-all duration-300 font-['Reem_Kufi_Fun'] ${activeStage === index
                                ? "text-white shadow-md transform scale-[1.02]"
                                : "text-zinc-500 hover:text-zinc-800 hover:bg-white/50"
                                }`}
                            style={activeStage === index ? { background: color || '#000' } : {}}
                        >
                            {stage.stageName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Standings Container */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
                {/* Content Area */}
                <div className="flex-1 flex flex-col gap-6 p-4 overflow-y-auto">
                    {Object.entries(standingsData[activeStage].groups).map(([groupName, teams]) => (
                        <div className="flex flex-col gap-2" key={groupName}>
                            <h3 className={`text-2xl font-bold tracking-tight text-black font-['Kanit']`}>GROUP {groupName}</h3>

                            <PointsTable pointsTableData={teams} headerColor={color} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EventStandings;