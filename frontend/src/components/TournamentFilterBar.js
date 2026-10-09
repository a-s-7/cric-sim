import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import DateRangePicker from "./DateRangePicker";

function ClearFiltersButton({handleClearFilters, hasActiveControls}) {
    const canClear = hasActiveControls;

    return (
        <button
            type="button"
            disabled={!canClear}
            onClick={handleClearFilters}
            title="Clear filters"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs shadow-sm transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 md:h-11 md:w-11 ${canClear
                ? "border-stone-200 bg-white text-stone-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md active:scale-95 active:border-red-200 active:bg-red-100"
                : "cursor-not-allowed border-stone-200 bg-white text-stone-300"
                }`}
        >
            <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
        </button>
    );
}

function TournamentFilterBar({
    showFilterBar,
    filterGroups,
    handleClearFilters,
    hasActiveControls,
    dateRange,
    setDateRange
}) {
    const getStatusButtonStyle = (isSelected) => {
        if (isSelected) {
            return "border-transparent bg-stone-900 font-semibold text-white shadow-sm";
        }

        return "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50";
    };

    return (<div className={`relative z-30 grid px-4 transition-[grid-template-rows,opacity,padding-bottom] duration-500 ease-in-out ${showFilterBar
        ? "grid-rows-[1fr] opacity-100 mt-0 overflow-visible pb-4 pt-0"
        : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none overflow-hidden pb-0 pt-0"
        }`}
    >
        <div className={`min-h-0 ${showFilterBar ? "overflow-visible" : "overflow-hidden"}`}>
            <div className={`flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 transition-transform duration-500 ease-in-out ${showFilterBar ? "translate-y-0" : "-translate-y-2"}`}>
                {filterGroups.map((group) => (<div key={group.label} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => group.setter([])}
                        className="-mx-1 -my-1 cursor-pointer rounded-md px-1 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900 active:bg-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                    >
                        {group.label}
                    </button>
                    <div className="flex items-center gap-1.5">
                        {group.options.map((option) => {
                            const isSelected = group.state.includes(option);

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() =>
                                        group.setter((prev) =>
                                            isSelected
                                                ? prev.filter((item) => item !== option)
                                                : [...prev, option]
                                        )
                                    }
                                    className={`flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-['Nunito_Sans'] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 sm:px-5 ${getStatusButtonStyle(isSelected)}`}
                                >
                                    {option === "T20" || option === "ODI"
                                        ? option
                                        : `${option.charAt(0).toUpperCase()}${option.slice(1).toLowerCase()}`}
                                </button>
                            );
                        })}
                    </div>
                </div>))}
                <div className="flex shrink-0 items-center gap-2">
                    <span className="font-['Nunito_Sans'] text-xs font-medium text-stone-600">Dates</span>
                    <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                </div>
                <ClearFiltersButton
                    handleClearFilters={handleClearFilters}
                    hasActiveControls={hasActiveControls}
                />
            </div>
        </div>
    </div>);
}

export default TournamentFilterBar;
