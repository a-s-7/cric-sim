import { useState } from "react";

const dataTypes = ["Tournaments", "Teams", "Venues"];

function DataManagerPage() {
    const [selectedType, setSelectedType] = useState("Tournaments");
    const selectedIndex = dataTypes.indexOf(selectedType);

    return (
        <div className="flex-1 bg-gray-50 font-['Nunito_Sans']">
            <div className="flex justify-center px-4 py-3">
                <div className="relative grid h-11 w-full max-w-[36rem] grid-cols-3 rounded-xl border border-stone-200 bg-white p-1 shadow-sm transition-colors hover:border-stone-300">
                    <div
                        className="pointer-events-none absolute left-1 h-9 rounded-lg bg-stone-900 transition-transform duration-300 ease-out"
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
                            className={`relative z-10 flex h-9 min-w-[80px] items-center justify-center rounded-lg px-4 font-['Reem_Kufi'] text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-200 ${selectedType === type
                                ? "text-white"
                                : "text-stone-500 hover:text-stone-900"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DataManagerPage;
