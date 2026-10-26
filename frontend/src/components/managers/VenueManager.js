import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTable,
    faMap,
    faArrowDown,
    faArrowUp,
    faLocationDot,
    faInbox,
    faPlus,
    faPen,
    faXmark,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { SearchBar } from "../SearchBar";
import Spinner from "../Spinner";
import VenueValueContainer from "./VenueValueContainer";
import VENUE_ENDPOINTS from "../../api/venues_endpoints";
import { venueFilterStyles } from "../../utils/selectStyles";

function downloadVenuesJson(venues) {
    const venueData = venues.map((venue) => Object.fromEntries(
        Object.entries(venue).filter(([field]) => field !== "_id")
    ));
    const file = new Blob([JSON.stringify({ venues: venueData }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "venues.json";
    link.click();
    URL.revokeObjectURL(url);
}

function VenueManager() {
    const [viewMode, setViewMode] = useState("table"); // "table" | "map"
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [sortColumns, setSortColumns] = useState([]);

    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingVenueIds, setEditingVenueIds] = useState([]);
    const [venueDrafts, setVenueDrafts] = useState({});
    const [savingVenueIds, setSavingVenueIds] = useState([]);
    const [venueErrors, setVenueErrors] = useState({});

    const viewOptions = [
        { id: "table", title: "Table view", icon: faTable },
        { id: "map", title: "Map view", icon: faMap },
    ];

    const fetchVenues = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(VENUE_ENDPOINTS.venues);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong.");
            }

            if (!Array.isArray(data.venues)) {
                throw new Error("Something went wrong.");
            }

            setVenues(data.venues);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVenues();
    }, [fetchVenues]);

    const search = searchQuery.trim().toLowerCase();

    const hasSearchQuery = search.length > 0;

    const hasCountryFilter = selectedCountries.length > 0;
    
    const countries = [...new Set(venues.map((venue) => venue.country).filter(Boolean))]
        .sort((countryA, countryB) => countryA.localeCompare(countryB));

    const filteredVenues = venues.filter((venue) =>
        (selectedCountries.length === 0 || selectedCountries.some((country) => country.value === venue.country)) &&
        [venue.stadium, venue.city, venue.country].some((value) =>
            String(value || "").toLowerCase().includes(search)
        )
    );
    
    const sortedVenues = [...filteredVenues].sort((venueA, venueB) => {
        for (const { field, direction } of sortColumns) {
            const result = String(venueA[field] || "").localeCompare(
                String(venueB[field] || ""),
                undefined,
                { sensitivity: "base", numeric: true }
            );

            if (result !== 0) return direction === "asc" ? result : -result;
        }

        return 0;
    });

    const clearSearchAndFilters = () => {
        setSearchQuery("");
        setSelectedCountries([]);
    };

    const openVenueEditor = (venue) => {
        setEditingVenueIds((currentIds) => [...currentIds, venue._id]);
        setVenueErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            delete nextErrors[venue._id];
            return nextErrors;
        });
        setVenueDrafts((currentDrafts) => ({
            ...currentDrafts,
            [venue._id]: {
                stadium: venue.stadium || "",
                city: venue.city || "",
                country: venue.country || "",
            },
        }));
    };

    const updateVenueDraft = (venueId, field, value) => {
        setVenueDrafts((currentDrafts) => ({
            ...currentDrafts,
            [venueId]: { ...currentDrafts[venueId], [field]: value },
        }));
    };

    const cancelVenueEdit = (venueId) => {
        setEditingVenueIds((currentIds) => currentIds.filter((id) => id !== venueId));
        setVenueDrafts((currentDrafts) => {
            const nextDrafts = { ...currentDrafts };
            delete nextDrafts[venueId];
            return nextDrafts;
        });
        setVenueErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            delete nextErrors[venueId];
            return nextErrors;
        });
    };

    const canSaveVenueDraft = (venue) => {
        const draft = venueDrafts[venue._id];
        if (!draft || savingVenueIds.includes(venue._id)) return false;

        const fields = ["stadium", "city", "country"];
        const hasBlankField = fields.some((field) => !String(draft[field] || "").trim());
        const hasChanges = fields.some((field) =>
            String(draft[field] || "").trim() !== String(venue[field] || "").trim()
        );

        return !hasBlankField && hasChanges;
    };

    const saveVenueDraft = async (venueId) => {
        const venue = venues.find((currentVenue) => currentVenue._id === venueId);
        const venueDraft = venueDrafts[venueId];
        if (!venue || !canSaveVenueDraft(venue)) return;

        setSavingVenueIds((currentIds) => [...currentIds, venueId]);
        setVenueErrors((currentErrors) => ({ ...currentErrors, [venueId]: "" }));

        try {
            const response = await fetch(VENUE_ENDPOINTS.update(venueId), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(venueDraft),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to save venue.");
            }
            if (!data.venue || data.venue._id !== venueId) {
                throw new Error("The server returned an invalid venue.");
            }

            setVenues((currentVenues) => currentVenues.map((venue) =>
                venue._id === venueId ? data.venue : venue
            ));
            cancelVenueEdit(venueId);
        } catch (saveError) {
            setVenueErrors((currentErrors) => ({
                ...currentErrors,
                [venueId]: saveError.message || "Unable to save venue.",
            }));
        } finally {
            setSavingVenueIds((currentIds) => currentIds.filter((id) => id !== venueId));
        }
    };

    const exportVenues = () => downloadVenuesJson(sortedVenues);

    const sortableColumns = [
        { field: "stadium", label: "Stadium" },
        { field: "city", label: "City" },
        { field: "country", label: "Country" },
    ];

    const handleSort = (field) => {
        setSortColumns((columns) => {
            const index = columns.findIndex((column) => column.field === field);

            if (index === -1) return [...columns, { field, direction: "asc" }];
            return columns.filter((column) => column.field !== field);
        });
    };

    const toggleSortDirection = (field) => {
        setSortColumns((columns) => columns.map((column) =>
            column.field === field
                ? { ...column, direction: column.direction === "asc" ? "desc" : "asc" }
                : column
        ));
    };

    return (
        // Venue Panel
        <div className="flex h-full min-w-0 w-full flex-col bg-gray-50 font-['Nunito_Sans']">
            {/* Control Bar */}
            <div className="flex min-h-12 flex-col items-center justify-between gap-4 p-4 font-['Nunito_Sans'] md:min-h-14 xl:flex-row">
                <div className="flex w-full flex-1 items-center gap-2 xl:w-auto">
                    <div className="flex shrink-0 items-center gap-2 font-['Reem_Kufi'] text-2xl font-medium text-black">
                        <h2>VENUES</h2>
                        <span className="inline-flex w-12 shrink-0 items-center font-['Nunito_Sans'] text-xl font-light tabular-nums text-black/50">
                            ({filteredVenues.length})
                        </span>
                    </div>

                    {/* View Switch */}
                    <div className="flex flex-1 items-center justify-center">
                        <div className="flex items-center gap-2">
                            <span className="hidden text-xs font-medium text-stone-600 lg:inline">View</span>
                            <div className="relative flex h-10 items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1 shadow-sm transition-colors hover:border-stone-300 md:h-11">
                                {/* Sliding pill */}
                                <div
                                    className="pointer-events-none absolute left-1 h-8 w-8 rounded-lg bg-stone-900 transition-transform duration-300 ease-out"
                                    style={{
                                        transform: `translateX(${viewOptions.findIndex((o) => o.id === viewMode) * 34}px)`,
                                    }}
                                />

                                {viewOptions.map(({ id, title, icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        title={title}
                                        onClick={() => setViewMode(id)}
                                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${viewMode === id ? "text-white" : "text-stone-500 hover:text-stone-900"
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={icon} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="w-full shrink-0 max-w-xl md:max-w-2xl xl:max-w-3xl">
                    <SearchBar
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                {/* Filter, Import, Export */}
                <div className="flex w-full flex-1 items-center justify-end gap-2 sm:gap-3 xl:w-auto">
                    {/* Filter */}
                    <div className="relative flex items-center gap-2">
                        <span className="hidden text-xs font-medium text-stone-600 lg:inline">Filter</span>
                        <div className="w-64 font-['Nunito_Sans']">
                            <Select
                                isMulti
                                isClearable
                                closeMenuOnSelect={false}
                                components={{ ValueContainer: VenueValueContainer }}
                                options={countries.map((country) => ({ label: country, value: country }))}
                                value={selectedCountries}
                                onChange={(selectedOptions) => setSelectedCountries(selectedOptions || [])}
                                placeholder="Countries"
                                menuPosition="fixed"
                                menuPortalTarget={document.body}
                                styles={venueFilterStyles}
                                noOptionsMessage={() => "No countries found"}
                            />
                        </div>
                    </div>

                    {/* Add Venue Button */}
                    <button
                        type="button"
                        title="Add venue"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs text-stone-500 shadow-sm transition-all duration-200 ease-in-out hover:border-stone-900 hover:bg-stone-900 hover:text-white hover:shadow-md active:scale-95 active:border-stone-950 active:bg-stone-950 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 md:h-11 md:w-11"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    </button>

                    {/* Import Button */}
                    <button
                        type="button"
                        title="Import venues"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs text-stone-500 shadow-sm transition-all duration-200 ease-in-out hover:border-stone-900 hover:bg-stone-900 hover:text-white hover:shadow-md active:scale-95 active:border-stone-950 active:bg-stone-950 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 md:h-11 md:w-11"
                    >
                        <FileDownloadOutlined sx={{ fontSize: 17 }} />
                    </button>

                    {/* Export Button */}
                    <button
                        type="button"
                        title="Export venues"
                        onClick={exportVenues}
                        disabled={sortedVenues.length === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs text-stone-500 shadow-sm transition-all duration-200 ease-in-out hover:border-stone-900 hover:bg-stone-900 hover:text-white hover:shadow-md active:scale-95 active:border-stone-950 active:bg-stone-950 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40 md:h-11 md:w-11"
                    >
                        <FileUploadOutlined sx={{ fontSize: 17 }} />
                    </button>
                </div>
            </div>

            {/* Data Container */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t border-stone-200 bg-white p-4">
                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center p-12">
                        <Spinner />
                    </div>
                ) : error ? (
                    <div className="animate-fadeIn flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                            <FontAwesomeIcon icon={faLocationDot} className="text-2xl text-rose-700" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xl font-semibold text-stone-700">Failed to load venues</p>
                            <p className="max-w-md text-base text-stone-500">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchVenues}
                            className="mt-1 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95"
                        >
                            Retry
                        </button>
                    </div>
                ) : viewMode === "map" ? (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="font-['Reem_Kufi'] text-xl font-medium tracking-wide text-stone-500">MAP VIEW</p>
                    </div>
                ) : filteredVenues.length === 0 ? (
                    <div className="animate-fadeIn flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                            <FontAwesomeIcon icon={faInbox} className="text-2xl text-stone-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-stone-700">No venues found</p>
                            <p className="text-sm text-stone-400">
                                {hasSearchQuery && hasCountryFilter
                                    ? "Try adjusting your search or filters"
                                    : hasSearchQuery
                                        ? "Try adjusting your search"
                                        : hasCountryFilter
                                            ? "Try adjusting your filters"
                                            : "Check back soon"}
                            </p>
                        </div>
                        {(hasSearchQuery || hasCountryFilter) && (
                            <button
                                type="button"
                                onClick={clearSearchAndFilters}
                                className="mt-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-stone-800 active:scale-95"
                            >
                                {hasSearchQuery && hasCountryFilter
                                    ? "Clear search and filters"
                                    : hasCountryFilter
                                        ? "Clear filters"
                                        : "Clear search"}
                            </button>
                        )}
                    </div>
                ) : (
                        <div className="venue-table-scroll min-h-0 min-w-0 w-full flex-1 overflow-auto rounded-2xl bg-white">
                            <div className="w-full min-w-full rounded-2xl border border-stone-200 bg-white">
                            <table className="w-full table-fixed border-collapse text-left font-['Nunito_Sans']">
                                <colgroup>
                                    <col className="w-[4%]" />
                                    <col className="w-[38%]" />
                                    <col className="w-[16%]" />
                                    <col className="w-[230px]" />
                                    <col className="w-[48px]" />
                                </colgroup>
                                <thead className="sticky top-0 z-10 border-b border-stone-300 bg-stone-100 font-['Reem_Kufi'] text-sm font-semibold uppercase tracking-wider text-stone-700">
                                    <tr>
                                        <th scope="col" className="px-4 py-3.5 text-center">#</th>
                                        {sortableColumns.map(({ field, label }) => {
                                            const sortColumn = sortColumns.find((column) => column.field === field);

                                            return (
                                                <th key={field} scope="col" className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSort(field)}
                                                            title={`${sortColumn ? "Turn off" : "Turn on"} ${label} sorting`}
                                                            className="text-left font-['Reem_Kufi'] text-sm font-semibold uppercase tracking-wider text-stone-700 transition-colors hover:text-stone-950"
                                                        >
                                                            {label}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSortDirection(field)}
                                                            disabled={!sortColumn}
                                                            title={sortColumn
                                                                ? `Sort ${label} ${sortColumn.direction === "asc" ? "descending" : "ascending"}`
                                                                : undefined}
                                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs text-stone-700 transition-colors hover:bg-stone-200 ${sortColumn ? "" : "invisible"}`}
                                                        >
                                                            <FontAwesomeIcon icon={sortColumn?.direction === "asc" ? faArrowDown : faArrowUp} />
                                                        </button>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                        <th scope="col" className="px-2 py-3.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 font-['Nunito_Sans'] text-md font-medium text-stone-600">
                                    {sortedVenues.map((venue, index) => (
                                        <tr
                                            key={venue._id}
                                            className="group transition-colors duration-150 hover:bg-stone-50/80"
                                        >
                                            {/* Index Number */}
                                            <td className="px-4 py-3.5 text-center text-xs font-medium text-stone-400">
                                                {index + 1}
                                            </td>

                                            {/* Stadium Name */}
                                            <td
                                                className="px-5 py-3.5"
                                                onDoubleClick={() => {
                                                    if (!editingVenueIds.includes(venue._id)) openVenueEditor(venue);
                                                }}
                                            >
                                                {editingVenueIds.includes(venue._id) ? (
                                                    <div className="space-y-1">
                                                        <input
                                                            required
                                                            autoFocus
                                                            disabled={savingVenueIds.includes(venue._id)}
                                                            value={venueDrafts[venue._id].stadium}
                                                            onChange={(event) => updateVenueDraft(venue._id, "stadium", event.target.value)}
                                                            className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-base font-semibold text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-stone-100"
                                                        />
                                                        {venueErrors[venue._id] && (
                                                            <p className="text-xs font-normal text-red-600">{venueErrors[venue._id]}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="font-semibold text-stone-900">{venue.stadium}</span>
                                                )}
                                            </td>

                                            {/* City */}
                                            <td
                                                className="px-5 py-3.5"
                                                onDoubleClick={() => {
                                                    if (!editingVenueIds.includes(venue._id)) openVenueEditor(venue);
                                                }}
                                            >
                                                {editingVenueIds.includes(venue._id) ? (
                                                    <input
                                                        disabled={savingVenueIds.includes(venue._id)}
                                                        value={venueDrafts[venue._id].city}
                                                        onChange={(event) => updateVenueDraft(venue._id, "city", event.target.value)}
                                                        className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-base text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-stone-100"
                                                    />
                                                ) : <span>{venue.city || "—"}</span>}
                                            </td>

                                            {/* Country */}
                                            <td
                                                className="px-5 py-2"
                                                onDoubleClick={() => {
                                                    if (!editingVenueIds.includes(venue._id)) openVenueEditor(venue);
                                                }}
                                            >
                                                {editingVenueIds.includes(venue._id) ? (
                                                    <input
                                                        disabled={savingVenueIds.includes(venue._id)}
                                                        value={venueDrafts[venue._id].country}
                                                        onChange={(event) => updateVenueDraft(venue._id, "country", event.target.value)}
                                                        className="h-9 w-full rounded-lg border border-stone-300 bg-white px-2 text-base text-stone-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-stone-100"
                                                    />
                                                ) : <span>{venue.country || "—"}</span>}
                                            </td>
                                            <td className="px-1 py-2 text-center">
                                                {editingVenueIds.includes(venue._id) ? (
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            title="Save changes"
                                                            disabled={!canSaveVenueDraft(venue)}
                                                            onClick={() => saveVenueDraft(venue._id)}
                                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Cancel editing"
                                                            disabled={savingVenueIds.includes(venue._id)}
                                                            onClick={() => cancelVenueEdit(venue._id)}
                                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        title={`Edit ${venue.stadium}`}
                                                        onClick={() => openVenueEditor(venue)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default VenueManager;
