import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowUp,
    faChevronDown,
    faFilter,
    faRotateLeft,
    faInbox,
    faArrowsRotate,
    faCircleNotch,
    faTableCellsLarge,
    faTableList
} from "@fortawesome/free-solid-svg-icons";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";
import { SearchBar } from "../components/SearchBar";
import TournamentIcon from "../components/TournamentIcon";
import TournamentCard from "../components/TournamentCard";
import Spinner from "../components/Spinner";


function TournamentsPage() {
    const navigate = useNavigate();

    const [tournaments, setTournaments] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedFormats, setSelectedFormats] = useState([]);
    const [sortField, setSortField] = useState("endDate");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilterBar, setShowFilterBar] = useState(false);

    const [groupField, setGroupField] = useState("all");

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [viewMode, setViewMode] = useState("icon"); // "icon" | "card"

    const [closedGroups, setClosedGroups] = useState({});

    const viewOptions = [
        { id: "icon", title: "Icon view", icon: faTableCellsLarge },
        { id: "card", title: "Card view", icon: faTableList },
    ];

    const categoryMap = {
        events: "international",
        leagues: "franchise"
    };

    const reverseCategoryMap = {
        international: "events",
        franchise: "leagues"
    };
    const categoryFrontendOptions = ["events", "leagues"];
    const formatOptions = ["T20", "ODI", "TEST", "HUNDRED"]
    const genderOptions = ["mens", "womens"];
    const statusOptions = ["upcoming", "active", "complete"];

    const activeFiltersCount =
        selectedStatuses.length +
        selectedGenders.length +
        selectedCategories.length +
        selectedFormats.length;

    const hasActiveControls = activeFiltersCount > 0;
    const hasSearchQuery = searchQuery.trim().length > 0;

    const handleClearFilters = () => {
        setSelectedStatuses([]);
        setSelectedGenders([]);
        setSelectedCategories([]);
        setSelectedFormats([]);
    };

    const handleClearSearchAndFilters = () => {
        handleClearFilters();
        setSearchQuery("");
    };

    const TOURNAMENTS_URL = TOURNAMENT_ENDPOINTS.tournaments;

    const getStatusButtonStyle = (option, isSelected) => {
        if (!isSelected) {
            return 'text-neutral-500 hover:bg-neutral-100 hover:text-black';
        }

        if (option === 'UPCOMING') {
            return 'bg-black text-white font-semibold shadow-sm';
        }

        if (option === 'ACTIVE') {
            return 'bg-neutral-800 text-white font-semibold shadow-sm';
        }

        if (option === 'COMPLETE') {
            return 'bg-neutral-600 text-white font-semibold shadow-sm';
        }
    };

    const getFilteredTournaments = () => {
        const filtered = tournaments.filter((tournament) => {
            const search = searchQuery.toLowerCase().trim();
            const searchableText = `${tournament.name} ${tournament.edition} ${tournament.acronym}`.toLowerCase();

            return (
                (search.length === 0 ||
                    search.split(/\s+/).every(token =>
                        searchableText.includes(token)
                    )) &&
                (selectedStatuses.length === 0 ||
                    selectedStatuses.includes(tournament.status)) &&
                (selectedGenders.length === 0 ||
                    selectedGenders.includes(tournament.division)) &&
                (selectedCategories.length === 0 ||
                    selectedCategories.some(category => categoryMap[category] === tournament.category)) &&
                (selectedFormats.length === 0 ||
                    selectedFormats.includes(tournament.format))
            );
        });

        if (sortOrder) {
            const direction = sortOrder === "asc" ? 1 : -1;

            return [...filtered].sort((a, b) => {
                if (sortField === "name") {
                    const nameComparison = (a.name || "").localeCompare(b.name || "");
                    const editionComparison = (a.edition || "").localeCompare(b.edition || "");

                    return direction * (nameComparison || editionComparison);
                }

                const aDate = Date.parse(a[sortField]);
                const bDate = Date.parse(b[sortField]);
                const aHasValidDate = Number.isFinite(aDate);
                const bHasValidDate = Number.isFinite(bDate);

                if (!aHasValidDate || !bHasValidDate) {
                    if (aHasValidDate === bHasValidDate) {
                        return (a.name || "").localeCompare(b.name || "");
                    }

                    return aHasValidDate ? -1 : 1;
                }

                const dateComparison = aDate - bDate;
                const nameComparison = (a.name || "").localeCompare(b.name || "");

                return direction * (dateComparison || nameComparison);
            });
        }

        return filtered;
    };

    const fetchTournaments = useCallback(async ({ silent = false } = {}) => {
        try {
            if (silent) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            const response = await fetch(TOURNAMENTS_URL);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            if (silent) {
                setIsRefreshing(false);
            } else {
                setIsLoading(false);
            }
        }
    }, [TOURNAMENTS_URL]);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    const filteredTournaments = getFilteredTournaments();

    const groupedTournaments = filteredTournaments.reduce((groups, tournament) => {
        const keyMap = { "status": tournament.status, "gender": tournament.division, "format": tournament.format, "category": reverseCategoryMap[tournament.category], "name": tournament.name };

        const key = keyMap[groupField];

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(tournament);

        return groups;
    }, {});

    const statusOrder = {
        active: 0,
        upcoming: 1,
        complete: 2
    };

    const formatOrder = {
        TEST: 3,
        ODI: 1,
        T20: 0,
    };

    const sortedGroups = Object.entries(groupedTournaments).sort((a, b) => {
        if (groupField === "status") {
            return statusOrder[a[0]] - statusOrder[b[0]];
        }

        if (groupField === "format") {
            return formatOrder[a[0]] - formatOrder[b[0]];
        }

        return a[0].localeCompare(b[0]);
    });

    const toggleGroup = (group) => {
        setClosedGroups((prev) => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="flex flex-col h-full min-h-0">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_5fr_2fr] sm:h-12 sm:items-center md:h-14 md:gap-3 p-4">
                    <div className="flex items-center gap-2 font-sans">
                        <span className="hidden text-xs text-stone-400 lg:inline">Group</span>
                        <div className="flex h-9 items-center rounded-xl border border-stone-200 bg-white px-1.5 shadow-sm sm:h-10 md:h-11">
                            <div className="relative h-full">
                                <select
                                    id="tournament-group-field"
                                    value={groupField}
                                    onChange={(event) => {
                                        setGroupField(event.target.value);
                                    }}
                                    className="h-full min-w-28 appearance-none rounded-lg bg-transparent py-0 pl-2 pr-7 text-sm font-medium text-stone-700 outline-none"
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
                        </div>

                        <div className="flex flex-1 items-center justify-center gap-2">
                            <span className="hidden text-xs font-medium text-stone-400 lg:inline">View</span>
                            <div className="relative flex h-9 items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1 shadow-sm sm:h-10 md:h-11">
                                {/* Sliding pill */}
                                <div
                                    className="absolute left-1 h-7 w-8 rounded-lg bg-stone-900 transition-transform duration-500 ease-out"
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
                                        className={`relative z-10 flex h-7 w-8 items-center justify-center rounded-lg text-sm transition-colors duration-300 ${viewMode === id ? "text-white" : "text-stone-400 hover:text-stone-700"
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={icon} />
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Search Controls */}
                    <div className="h-10 sm:h-full flex items-center justify-center"><SearchBar placeholder="Search tournaments..." value={searchQuery} onChange={setSearchQuery} /></div>

                    {/* Sorting Controls + Filter Dropdown */}
                    <div className="flex h-10 items-center justify-end font-sans sm:h-full">
                        <div className="flex flex-1 items-center justify-center gap-2">
                            <span className="hidden text-xs font-medium text-stone-400 lg:inline">Sort</span>
                            <div className="flex h-9 items-center rounded-xl border border-stone-200 bg-white px-1.5 shadow-sm transition-colors hover:border-stone-300 sm:h-10 md:h-11">
                                <div className="relative h-full">
                                    <select
                                        id="tournament-sort-field"
                                        value={sortField}
                                        onChange={(event) => {
                                            setSortField(event.target.value);
                                            setSortOrder((previousOrder) => previousOrder || "asc");
                                        }}
                                        className="h-full min-w-28 appearance-none rounded-lg bg-transparent py-0 pl-2 pr-7 text-sm font-medium text-stone-700 outline-none"
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
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all duration-200 ${sortOrder
                                        ? "bg-stone-900 text-white"
                                        : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                        }`}
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
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-900 hover:bg-stone-900 hover:text-white hover:shadow-md active:translate-y-0 active:scale-95 active:border-stone-950 active:bg-stone-950 active:shadow-inner sm:h-10 sm:w-10 md:h-11 md:w-11"
                            >
                                <FontAwesomeIcon icon={isRefreshing ? faCircleNotch : faArrowsRotate} className={`text-xs ${isRefreshing ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowFilterBar((prev) => !prev)}
                                title={showFilterBar ? "Hide filters" : "Show filters"}
                                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 active:shadow-inner sm:h-10 sm:w-10 md:h-11 md:w-11 ${showFilterBar
                                    ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                                    : "border-stone-200 bg-white text-stone-500 shadow-sm hover:border-stone-300 hover:text-stone-800"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faFilter} className="text-xs" />
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
                <div
                    className={`grid transition-all duration-300 ease-in-out p-4 ${showFilterBar
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                        }`}
                >
                    <div className="overflow-hidden">
                        <div
                            className={`flex h-8 sm:h-10 md:h-12 items-center bg-white rounded-2xl border border-gray-200 overflow-hidden transition-transform duration-300 ease-in-out ${showFilterBar ? "translate-y-0" : "-translate-y-2"
                                }`}
                        >
                            <div className="w-1/4 h-full flex flex-row items-center justify-center gap-1 px-1">
                                {statusOptions.map((option) => {
                                    const isSelected = selectedStatuses.includes(option);

                                    return (
                                        <button
                                            key={option}
                                            onClick={() =>
                                                setSelectedStatuses((prev) =>
                                                    isSelected
                                                        ? prev.filter((item) => item !== option)
                                                        : [...prev, option]
                                                )
                                            }
                                            className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                        >
                                            {option.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="h-3/4 border-l border-gray-200" />
                            <div className="flex-1 h-full flex items-center justify-center">
                                {genderOptions.map((option) => {
                                    const isSelected = selectedGenders.includes(option);

                                    return (
                                        <button
                                            key={option}
                                            onClick={() =>
                                                setSelectedGenders((prev) =>
                                                    isSelected
                                                        ? prev.filter((item) => item !== option)
                                                        : [...prev, option]
                                                )
                                            }
                                            className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                        >
                                            {option.toUpperCase()}
                                        </button>
                                    );
                                })}
                                <div className="h-3/4 border-l border-gray-200" />
                                {formatOptions.map((option) => {
                                    const isSelected = selectedFormats.includes(option);

                                    return (
                                        <button
                                            key={option}
                                            onClick={() =>
                                                setSelectedFormats((prev) =>
                                                    isSelected
                                                        ? prev.filter((item) => item !== option)
                                                        : [...prev, option]
                                                )
                                            }
                                            className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                        >
                                            {option.toUpperCase()}
                                        </button>
                                    );
                                })}

                                <div className="h-3/4 border-l border-gray-200" />


                                {categoryFrontendOptions.map((option) => {
                                    const isSelected = selectedCategories.includes(option);

                                    return (
                                        <button
                                            key={option}
                                            onClick={() =>
                                                setSelectedCategories((prev) =>
                                                    isSelected
                                                        ? prev.filter((item) => item !== option)
                                                        : [...prev, option]
                                                )
                                            }
                                            className={`flex-1 h-3/4 flex items-center justify-center rounded-xl text-xs font-medium transition-colors ${getStatusButtonStyle(option, isSelected)}`}
                                        >
                                            {option.toUpperCase()}
                                        </button>
                                    );
                                })}


                            </div>
                            <div className="h-3/4 border-l border-gray-200" />
                            <div className="h-full flex items-center justify-center px-1.5 sm:px-2">
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    disabled={!hasActiveControls}
                                    title="Clear filters"
                                    className={`h-3/4 px-4 flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${hasActiveControls
                                        ? "text-stone-600 hover:text-red-600 hover:bg-red-50 active:scale-95 cursor-pointer"
                                        : "text-stone-300 cursor-not-allowed"
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faRotateLeft} className="text-xs sm:text-sm transition-transform duration-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <Spinner key="loading" className="animate-fadeIn" />
                ) : filteredTournaments.length === 0 ? (
                    <div key="empty" className="animate-fadeIn w-full flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 bg-white">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                            <FontAwesomeIcon icon={faInbox} className="text-2xl text-stone-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-stone-700">No tournaments found</p>
                            <p className="text-sm text-stone-400">
                                {hasSearchQuery && hasActiveControls
                                    ? "Try adjusting your search or filters"
                                    : hasSearchQuery
                                        ? "Try adjusting your search"
                                        : hasActiveControls
                                            ? "Try adjusting your filters"
                                            : "Check back soon"}
                            </p>
                        </div>
                        {(hasActiveControls || hasSearchQuery) && (
                            <button
                                type="button"
                                onClick={handleClearSearchAndFilters}
                                className="mt-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-stone-800 active:scale-95"
                            >
                                {hasActiveControls && hasSearchQuery ? "Clear search and filters" : hasActiveControls ? "Clear filters" : "Clear search"}
                            </button>
                        )}
                    </div>
                ) : (
                    (<div key="grid" className="[scrollbar-gutter:stable] animate-fadeIn w-full flex-1 min-h-0 overflow-y-auto bg-white">
                        <div className="flex flex-col gap-4 pb-4">
                            {sortedGroups.map(([group, groupedTournaments]) => (
                                <div key={group}>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group)}
                                        className="group font-['Kanit'] m-4 mb-3 text-xl flex font-medium items-center gap-2 text-black
                                        transition-transform duration-150 active:scale-[0.98]
                                        focus-visible:outline-none"
                                                                >
                                        <h2 className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-200 [@media(hover:hover)]:group-hover:decoration-black">
                                            {groupField === "all" ? "TOURNAMENTS" : group.toUpperCase()}
                                        </h2>

                                        <span className="font-['Kanit'] text-md font-light text-black/50 transition-colors duration-200 [@media(hover:hover)]:group-hover:text-black">
                                            ({groupedTournaments.length})
                                        </span>

                                        <FontAwesomeIcon
                                            icon={faChevronDown}
                                            className={`text-xs text-stone-400 transition-all duration-200 [@media(hover:hover)]:group-hover:text-black ${closedGroups[group] ? "-rotate-90" : ""
                                                }`}
                                        />
                                    </button>

                                    <div
                                        className={`px-4 grid transition-[grid-template-rows] ease-in-out ${closedGroups[group]
                                            ? "grid-rows-[0fr] duration-300 delay-[150ms] pointer-events-none"
                                            : "grid-rows-[1fr] duration-300 delay-0 pointer-events-auto"
                                            }`}
                                    >
                                        <div className="min-h-0 overflow-visible">
                                            <div
                                                className={`transition-[transform,opacity] ease-out ${closedGroups[group]
                                                    ? "translate-y-2 opacity-0 duration-200 delay-0"
                                                    : "translate-y-0 opacity-100 duration-250 delay-[220ms]"
                                                    }`}
                                            >
                                                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,130px),1fr))] sm:grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] justify-start gap-5">
                                                    {groupedTournaments.map((tournament, index) => {
                                                        const Card = viewMode === "icon" ? TournamentIcon : TournamentCard;
                                                        return (
                                                            <Card
                                                                key={tournament["baseId"] + "-" + index}
                                                                tournament={tournament}
                                                                onClick={() => navigate("/tournaments/" + tournament["baseId"])}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>)
                )
                }
            </div>


        </div>

    );
}

export default TournamentsPage;
