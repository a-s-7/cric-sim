import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowUp,
    faChevronDown,
    faFilter,
    faRotateLeft,
    faInbox
} from "@fortawesome/free-solid-svg-icons";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";
import { SearchBar } from "../components/SearchBar";

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
    const [showFilterBar, setShowFilterBar] = useState(true);

    const categoryMap = {
        events: "international",
        leagues: "franchise"
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
        // setSortField("name");
        // setSortOrder("asc");
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

            // console.log("Search:", search);
            // console.log("Tokens:", search.split(/\s+/));
            // console.log("Searchable:", searchableText);

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

    const fetchTournaments = useCallback(async (viewIndex, genderIndex) => {
        try {
            const response = await fetch(TOURNAMENTS_URL);
            if (!response.ok) {
                throw new Error("Response was not ok");
            }
            const result = await response.json();
            setTournaments(result);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [TOURNAMENTS_URL]);

    useEffect(() => {
        fetchTournaments(0, 0);
    }, [fetchTournaments]);

    const filteredTournaments = getFilteredTournaments();

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-gray-50">
            <div className="flex flex-col h-full">
                {/* View + Search + Sorting Bar */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_4fr_2fr] sm:h-12 sm:items-center md:h-14 md:gap-3">
                    <div className="flex items-center gap-2 px-1 text-stone-900 bg-red-500">
                        LEFT
                    </div>
                    <div className="h-10 sm:h-full"><SearchBar placeholder="Search tournaments..." value={searchQuery} onChange={setSearchQuery} /></div>
                    <div className="flex h-10 items-center justify-end gap-1 font-sans sm:h-full sm:gap-1.5">
                        <span className="hidden text-xs font-medium text-stone-400 lg:inline">Sort</span>
                        <div className="relative h-9 sm:h-10 md:h-11">
                            <label htmlFor="tournament-sort-field" className="sr-only">Sort tournaments by</label>
                            <select
                                id="tournament-sort-field"
                                value={sortField}
                                onChange={(event) => {
                                    setSortField(event.target.value);
                                    setSortOrder((previousOrder) => previousOrder || "asc");
                                }}
                                className="h-full min-w-28 appearance-none rounded-lg bg-transparent py-0 pl-2 pr-7 text-sm font-medium text-stone-700 outline-none transition-colors hover:bg-white focus:bg-white focus:ring-1 focus:ring-stone-200"
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
                        <div className="h-5 border-l border-stone-200" />
                        <div className="flex h-9 items-center sm:h-10 md:h-11">
                            <button
                                type="button"
                                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                                title={sortOrder === "desc"
                                    ? (sortField === "name" ? "Sorted Z to A. Switch to A to Z" : "Sorted latest first. Switch to earliest first")
                                    : (sortField === "name" ? "Sorted A to Z. Switch to Z to A" : "Sorted earliest first. Switch to latest first")}
                                className={`h-8 w-8 flex items-center justify-center rounded-md text-xs transition-all duration-200 ${sortOrder
                                        ? "bg-stone-900 text-white"
                                        : "text-stone-400 hover:bg-white hover:text-stone-700"
                                    }`}
                            >
                                <FontAwesomeIcon icon={sortOrder === "desc" ? faArrowUp : faArrowDown} />
                            </button>
                        </div>
                        <div className="h-5 border-l border-stone-200" />
                        <button
                            type="button"
                            onClick={() => setShowFilterBar((prev) => !prev)}
                            className={`relative h-8 w-8 flex items-center justify-center rounded-md text-xs transition-all duration-200 ${showFilterBar
                                    ? "bg-stone-900 text-white"
                                    : "text-stone-400 hover:bg-white hover:text-stone-700"
                                }`}
                        >
                            <FontAwesomeIcon icon={faFilter} className="text-xs" />
                            {activeFiltersCount > 0 && (
                                <span
                                    className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${showFilterBar ? "bg-white text-black shadow-sm" : "bg-stone-900 text-white"
                                        }`}
                                >
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div
                    className={`grid transition-all duration-300 ease-in-out ${showFilterBar
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

                {filteredTournaments.length === 0 ? (
                    <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
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
                ) :
                    (<div className="w-full grid grid-cols-9 gap-5 py-4">
                        {filteredTournaments.map((tournament, index) => (
                            <div
                                onClick={() => navigate("/tournaments/" + tournament["baseId"])}
                                key={tournament["baseId"] + "-" + index}
                                className="rounded-3xl border border-gray-300 
                                                shadow-lg shadow-gray-400 hover:shadow-xl hover:shadow-gray-500
                                                hover:scale-105 transition-all duration-300 
                                                cursor-pointer w-full aspect-square flex items-center justify-center relative"
                                style={{ backgroundColor: tournament["tileBackgroundColor"] }}
                            >
                                <img
                                    src={tournament["mainLogo"]}
                                    alt={tournament["name"]}
                                    className={`${tournament["category"] === "franchise" ? "h-[55%] w-[55%]" : "h-[65%] w-[65%]"} object-contain`}
                                />
                                {tournament["category"] === "franchise" && <div className="absolute font-['Outfit'] bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 text-white text-xs font-bold shadow-sm whitespace-nowrap">
                                    {tournament["edition"]}
                                </div>}
                            </div>
                        ))}
                    </div>)
                }
            </div>

        </div>

    );
}

export default TournamentsPage;
