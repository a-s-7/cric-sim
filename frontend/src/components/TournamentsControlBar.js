import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SearchBar } from "./SearchBar";
import {
    faArrowDown,
    faArrowUp,
    faTableCellsLarge,
    faChevronDown,
    faExpandAlt,
    faCompressAlt,
    faArrowsRotate,
    faTableList,
    faSliders
} from "@fortawesome/free-solid-svg-icons";

function TournamentsControlBar({groupField, setGroupField, toggleAll, allClosed, viewMode, setViewMode, sortField, setSortField, 
                                sortOrder, setSortOrder, searchQuery, setSearchQuery, fetchTournaments, isRefreshing, showFilterBar, setShowFilterBar, activeFiltersCount}) {
    
    const viewOptions = [
        { id: "icon", title: "Icon view", icon: faTableCellsLarge },
        { id: "card", title: "Card view", icon: faTableList },
    ];

    return (
        <div className="grid min-h-12 grid-cols-1 gap-2 p-4 sm:grid-cols-[2fr_5fr_2fr] sm:items-center md:min-h-14 md:gap-3">
            <div className="flex items-center gap-2 font-['Nunito_Sans']">
                <span className="hidden text-xs font-medium text-stone-600 lg:inline">Group</span>
                <div className="flex h-10 items-center rounded-xl border border-stone-200 bg-white px-1.5 shadow-sm transition-colors hover:border-stone-300 md:h-11">
                    <div className="relative h-full">
                        <select
                            id="tournament-group-field"
                            value={groupField}
                            onChange={(event) => {
                                setGroupField(event.target.value);
                            }}
                            className="h-full min-w-26 appearance-none rounded-lg bg-transparent py-0 pl-2 pr-7 text-sm font-medium text-stone-700 outline-none"
                        >
                            <option value="all">All</option>
                            <option value="status">Status</option>
                            <option value="gender">Gender</option>
                            <option value="format">Format</option>
                            <option value="category">Category</option>
                            <option value="name">Name</option>
                        </select>
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                        />
                    </div>

                    <div className="mx-1 h-5 border-l border-stone-200" />

                    <button
                        type="button"
                        onClick={toggleAll}
                        title={allClosed ? "Expand all" : "Collapse all"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs text-stone-500 transition-all
                                    duration-[400ms] ease-in-out hover:bg-stone-900 hover:text-white hover:shadow-md active:scale-95 
                                    active:bg-stone-950 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                    >
                        <FontAwesomeIcon
                            icon={allClosed ? faExpandAlt : faCompressAlt}
                            className="text-xs"
                        />
                    </button>

                </div>

                <div className="flex flex-1 items-center justify-center gap-2">
                    <span className="hidden text-xs font-medium text-stone-600 lg:inline">View</span>
                    <div className="relative flex h-10 items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1 shadow-sm transition-colors hover:border-stone-300 md:h-11">
                        {/* Sliding pill */}
                        <div
                            className="pointer-events-none absolute left-1 h-8 w-8 rounded-lg bg-stone-900 transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(${viewOptions.findIndex(o => o.id === viewMode) * 34}px)`,
                            }}
                        />

                        {viewOptions.map(({ id, title, icon }) => (
                            <button
                                key={id}
                                type="button"
                                title={title}
                                onClick={() => setViewMode(id)}
                                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors duration-200 
                                    focus-visible:outline-none focus-visible:ring-2 
                                    focus-visible:ring-stone-400 ${viewMode === id ? "text-white" : "text-stone-500 hover:text-stone-900"
                                    }`}
                            >
                                <FontAwesomeIcon icon={icon} />
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Search Controls */}
            <div className="min-w-0 flex h-10 items-center justify-center sm:h-full"><SearchBar placeholder="Search tournaments..." value={searchQuery} onChange={setSearchQuery} /></div>

            {/* Sorting Controls + Refresh Button + Filter Button */}
            <div className="flex h-10 items-center justify-end font-['Nunito_Sans'] sm:h-full">
                <div className="flex flex-1 items-center justify-center gap-2">
                    <span className="hidden text-xs font-medium text-stone-600 lg:inline">Sort</span>
                    <div className="flex h-10 items-center rounded-xl border border-stone-200 bg-white px-1.5 shadow-sm transition-colors hover:border-stone-300 md:h-11">
                        <div className="relative h-full">
                            <select
                                id="tournament-sort-field"
                                value={sortField}
                                onChange={(event) => {
                                    setSortField(event.target.value);
                                    setSortOrder((previousOrder) => previousOrder || "asc");
                                }}
                                className="h-full min-w-28 appearance-none rounded-lg bg-transparent py-0 pl-2 pr-7 font-['Nunito_Sans'] text-sm font-medium text-stone-700 outline-none"
                            >
                                <option value="name">Name</option>
                                <option value="startDate">Start date</option>
                                <option value="endDate">End date</option>
                            </select>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                            />
                        </div>
                        <div className="mx-1 h-5 border-l border-stone-200" />
                        <button
                            type="button"
                            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                            title={sortOrder === "desc"
                                ? (sortField === "name" ? "Z to A" : "Latest to earliest")
                                : (sortField === "name" ? "A to Z" : "Earliest to latest")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-xs text-white transition-all duration-150 hover:bg-stone-800 active:scale-95 active:bg-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                        >
                            <FontAwesomeIcon icon={sortOrder === "desc" ? faArrowUp : faArrowDown} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => fetchTournaments({ silent: true })}
                        title="Refresh tournaments"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs text-stone-500 shadow-sm transition-all duration-200 ease-in-out hover:border-stone-900 hover:bg-stone-900 hover:text-white hover:shadow-md active:scale-95 active:border-stone-950 active:bg-stone-950 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 md:h-11 md:w-11"
                    >
                        <FontAwesomeIcon icon={faArrowsRotate} className={`text-xs ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilterBar((prev) => !prev)}
                        title={showFilterBar ? "Hide filters" : "Show filters"}
                        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border text-xs transition-all duration-200 ease-in-out hover:border-stone-900 hover:bg-stone-900 hover:text-white hover:shadow-md active:scale-95 active:border-stone-950 active:bg-stone-950 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 md:h-11 md:w-11 ${showFilterBar
                            ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                            : "border-stone-200 bg-white text-stone-500 shadow-sm"
                            }`}
                    >
                        <FontAwesomeIcon icon={faSliders} />
                        {activeFiltersCount > 0 && (
                            <span
                                className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-stone-200 px-1 text-[10px] font-bold ${showFilterBar ? "bg-white text-black shadow-sm" : "bg-stone-900 text-white"
                                    }`}
                            >
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TournamentsControlBar;
