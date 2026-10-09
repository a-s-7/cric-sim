import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TOURNAMENT_ENDPOINTS from "../api/tournaments_endpoints";
import Spinner from "../components/Spinner";
import TournamentEmptyState from "../components/TournamentEmptyState";
import TournamentGroups from "../components/TournamentGroups";
import TournamentFilterBar from "../components/TournamentFilterBar";
import TournamentsControlBar from "../components/TournamentsControlBar";

function TournamentsPage() {
    const navigate = useNavigate();

    const TOURNAMENTS_URL = TOURNAMENT_ENDPOINTS.tournaments;
    
    const [tournaments, setTournaments] = useState([]);

    const [groupField, setGroupField] = useState("all");
    const [closedGroups, setClosedGroups] = useState({});

    const [viewMode, setViewMode] = useState("icon"); // "icon" | "card"

    const [searchQuery, setSearchQuery] = useState("");

    const [sortField, setSortField] = useState("endDate");
    const [sortOrder, setSortOrder] = useState("desc");

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [showFilterBar, setShowFilterBar] = useState(false);

    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedFormats, setSelectedFormats] = useState([]);
    const [dateRange, setDateRange] = useState({ start: null, end: null });

    const categoryMap = {
        events: "international",
        leagues: "franchise"
    };

    const reverseCategoryMap = {
        international: "events",
        franchise: "leagues"
    };

     const statusOrder = {
        active: 0,
        upcoming: 1,
        complete: 2
    };

    const formatOrder = {
        Test: 3,
        ODI: 1,
        T20: 0,
    };

    const isDateRangeActive = Boolean(dateRange.start || dateRange.end);

    const activeFiltersCount =
        selectedStatuses.length +
        selectedGenders.length +
        selectedCategories.length +
        selectedFormats.length +
        (isDateRangeActive ? 1 : 0);

    const hasActiveControls = activeFiltersCount > 0;
    const hasSearchQuery = searchQuery.trim().length > 0;

    const handleClearFilters = () => {
        setSelectedStatuses([]);
        setSelectedGenders([]);
        setSelectedCategories([]);
        setSelectedFormats([]);
        setDateRange({ start: null, end: null });
    };

    const handleClearSearchAndFilters = () => {
        handleClearFilters();
        setSearchQuery("");
    };

    const getFilteredTournaments = () => {
        const filtered = tournaments.filter((tournament) => {
            const search = searchQuery.toLowerCase().trim();
            const searchableText = `${tournament.name} ${tournament.edition} ${tournament.acronym}`.toLowerCase();

            const normalizeDate = (val) => {
                if (!val) return null;
                const time = Date.parse(val);
                if (Number.isNaN(time)) return null;
                return new Date(time).toISOString().slice(0, 10);
            };

            const matchesDateRange = () => {
                if (!dateRange.start && !dateRange.end) return true;
                const tStart = normalizeDate(tournament.startDate);
                const tEnd = normalizeDate(tournament.endDate) || tStart;

                if (!tStart && !tEnd) return false;

                if (dateRange.start && tEnd && tEnd < dateRange.start) return false;
                if (dateRange.end && tStart && tStart > dateRange.end) return false;
                return true;
            };

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
                    selectedFormats.includes(tournament.format)) &&
                matchesDateRange()
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

    const groupNames = sortedGroups.map(([group]) => group);

    const allClosed = groupNames.every((group) => closedGroups[group]);

    const toggleAll = () => {
        setClosedGroups(
            Object.fromEntries(groupNames.map((group) => [group, !allClosed]))
        );
    };

    const handleTournamentClick = (tournament) => {
        navigate("/tournaments/" + tournament.baseId);
    }

    const categoryFrontendOptions = ["events", "leagues"];
    const statusOptions = ["upcoming", "active", "complete"];
    const genderOptions = ["mens", "womens"];
    const formatOptions = ["T20", "ODI", "Test"]

    const filterGroups = [
        { label: "Status", options: statusOptions, state: selectedStatuses, setter: setSelectedStatuses },
        { label: "Gender", options: genderOptions, state: selectedGenders, setter: setSelectedGenders },
        { label: "Format", options: formatOptions, state: selectedFormats, setter: setSelectedFormats },
        { label: "Category", options: categoryFrontendOptions, state: selectedCategories, setter: setSelectedCategories }
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 font-['Nunito_Sans']">
            <div className="flex flex-col h-full min-h-0">
                <TournamentsControlBar
                    groupField={groupField}
                    setGroupField={setGroupField}
                    toggleAll={toggleAll}
                    allClosed={allClosed}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sortField={sortField}
                    setSortField={setSortField}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    fetchTournaments={fetchTournaments}
                    isRefreshing={isRefreshing}
                    showFilterBar={showFilterBar}
                    setShowFilterBar={setShowFilterBar}
                    activeFiltersCount={activeFiltersCount}
                />

                <TournamentFilterBar
                    showFilterBar={showFilterBar}
                    filterGroups={filterGroups}
                    handleClearFilters={handleClearFilters}
                    hasActiveControls={hasActiveControls}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                />

                <div className="[scrollbar-gutter:stable] flex w-full flex-1 min-h-0 flex-col overflow-y-auto bg-white">
                    {isLoading ? (
                        <Spinner key="loading" className="animate-fadeIn" />
                    ) : filteredTournaments.length === 0 ? (
                        <TournamentEmptyState
                            hasActiveControls={hasActiveControls}
                            hasSearchQuery={hasSearchQuery}
                            onClear={handleClearSearchAndFilters}
                        />
                    ) : (
                        <TournamentGroups
                            sortedGroups={sortedGroups}
                            toggleGroup={toggleGroup}
                            groupField={groupField}
                            closedGroups={closedGroups}
                            viewMode={viewMode}
                            handleTournamentClick={handleTournamentClick}
                        />
                    )}
                </div>
            </div>
        </div>

    );
}

export default TournamentsPage;
