import { useState } from "react";
import TeamManager from "../components/managers/TeamManager";
import VenueManager from "../components/managers/VenueManager";
import TournamentManager from "../components/managers/TournamentManager";

const dataTypes = ["Tournaments", "Teams", "Venues"];

function DataManagerPage() {
    const [selectedType, setSelectedType] = useState("Tournaments");
    const selectedIndex = dataTypes.indexOf(selectedType);

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gray-50 font-['Nunito_Sans']">
            <div className="flex shrink-0 justify-center px-4 py-3">
                <div className="relative grid h-11 w-full max-w-[36rem] grid-cols-3 rounded-2xl border border-stone-200 bg-white p-1 shadow-sm transition-colors hover:border-stone-300">
                    <div
                        className="pointer-events-none absolute left-1 h-9 rounded-xl bg-stone-900 transition-transform duration-300 ease-out"
                        style={{
                            width: "calc((100% - 8px) / 3)",
                            top: "50%",
                            transform: `translate(${selectedIndex * 100}%, -50%)`,
                        }}
                    />
                    {dataTypes.map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={`relative z-10 flex h-9 min-w-[80px] items-center justify-center rounded-xl px-4 font-['Nunito_Sans'] text-[13px] font-normal uppercase tracking-[0.08em] transition-colors duration-200 ${selectedType === type
                                ? "text-white"
                                : "text-stone-500 hover:text-stone-900"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <div className="min-h-0 min-w-0 w-full flex-1 overflow-hidden bg-gray-50">
                {selectedType === "Tournaments" && <TournamentManager />}
                {selectedType === "Teams" && <TeamManager />}
                {selectedType === "Venues" && <VenueManager />}
            </div>
        </div>
    );
}

export default DataManagerPage;
