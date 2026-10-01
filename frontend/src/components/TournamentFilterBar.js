import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";

function TournamentFilterBar({showFilterBar, filterGroups, handleClearFilters, hasActiveControls}) {
    const getStatusButtonStyle = (option, isSelected) => {
        if (!isSelected) {
            return 'text-neutral-500 hover:bg-neutral-100 hover:text-black';
        }

        const normalizedOption = option.toUpperCase();

        if (normalizedOption === 'UPCOMING') {
            return 'bg-black text-white font-semibold shadow-sm';
        }

        if (normalizedOption === 'ACTIVE') {
            return 'bg-neutral-800 text-white font-semibold shadow-sm';
        }

        if (normalizedOption === 'COMPLETE') {
            return 'bg-neutral-600 text-white font-semibold shadow-sm';
        }

        return 'bg-stone-900 text-white font-semibold shadow-sm';
    };

    return (<div className={`grid transition-all duration-300 ease-in-out p-4 ${showFilterBar
        ? "grid-rows-[1fr] opacity-100 mt-3"
        : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
        }`}
    >
        <div className="overflow-hidden">
            <div className={`flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 transition-transform duration-300 ease-in-out ${showFilterBar ? "translate-y-0" : "-translate-y-2"}`}>
                {filterGroups.map((group) => (<div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-400">{group.label}</span>
                    <div className="flex min-h-12 items-center gap-1 rounded-2xl border border-stone-200 bg-white px-2 py-2 shadow-sm">
                        {group.options.map((option) => {
                            const isSelected = group.state.includes(option);

                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        group.setter((prev) =>
                                            isSelected
                                                ? prev.filter((item) => item !== option)
                                                : [...prev, option]
                                        )
                                    }
                                    className={`h-8 px-2 sm:px-3 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                >
                                    {option.toUpperCase()}
                                </button>
                            );
                        })}
                    </div>
                </div>))}
                <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={!hasActiveControls}
                    title="Clear filters"
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs shadow-sm transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 md:h-11 md:w-11 ${hasActiveControls
                        ? "border-stone-200 bg-white text-stone-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md active:scale-95 active:border-red-200 active:bg-red-100"
                        : "cursor-not-allowed border-stone-200 bg-white text-stone-300"
                        }`}
                >
                    <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
                </button>
            </div>
        </div>
    </div>);
}

export default TournamentFilterBar;