import { useState, useRef, useEffect, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faChevronDown,
    faXmark
} from "@fortawesome/free-solid-svg-icons";
import { Calendar } from "./Calendar";

function DateRangePicker({ dateRange = { start: null, end: null }, onDateRangeChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Initial calendar month view based on selected start date or current date
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (dateRange?.start) {
            const parsed = parseISO(dateRange.start);
            if (isValid(parsed)) return parsed;
        }
        return new Date();
    });

    // When the picker opens, ensure it focuses on the active selection's month, or the current month
    useEffect(() => {
        if (isOpen) {
            if (dateRange?.start) {
                const parsed = parseISO(dateRange.start);
                if (isValid(parsed)) {
                    setCurrentMonth(parsed);
                    return;
                }
            }
            setCurrentMonth(new Date());
        }
    }, [isOpen, dateRange?.start]);

    // Sync currentMonth when start date changes from outside (e.g. cleared)
    useEffect(() => {
        if (dateRange?.start) {
            const parsed = parseISO(dateRange.start);
            if (isValid(parsed)) {
                setCurrentMonth(parsed);
                return;
            }
        }
        setCurrentMonth(new Date());
    }, [dateRange?.start]);

    // Close on click outside or Escape key
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Map string ISO dates to react-day-picker Date objects
    const selectedRange = useMemo(() => {
        return {
            from: dateRange?.start ? parseISO(dateRange.start) : undefined,
            to: dateRange?.end ? parseISO(dateRange.end) : undefined,
        };
    }, [dateRange?.start, dateRange?.end]);

    const handleCalendarSelect = (range) => {
        if (!range) {
            onDateRangeChange({ start: null, end: null });
            return;
        }

        const startStr = range.from && isValid(range.from) ? format(range.from, "yyyy-MM-dd") : null;
        const endStr = range.to && isValid(range.to) ? format(range.to, "yyyy-MM-dd") : null;

        onDateRangeChange({ start: startStr, end: endStr });
    };

    const handleClearDates = (e) => {
        if (e) e.stopPropagation();
        onDateRangeChange({ start: null, end: null });
        setCurrentMonth(new Date());
    };

    const currentYear = new Date().getFullYear();
    const yearPresets = useMemo(() => [
        currentYear - 2,
        currentYear - 1,
        currentYear,
        currentYear + 1
    ], [currentYear]);

    const getPresetYearRange = () => {
        const startYear = Number(dateRange?.start?.slice(0, 4));
        const endYear = Number(dateRange?.end?.slice(0, 4));

        if (
            dateRange?.start !== `${startYear}-01-01` ||
            dateRange?.end !== `${endYear}-12-31` ||
            startYear > endYear
        ) {
            return null;
        }

        return { start: startYear, end: endYear };
    };

    const isYearPresetActive = (year) => {
        const presetRange = getPresetYearRange();
        return presetRange && year >= presetRange.start && year <= presetRange.end;
    };

    const handleYearPresetClick = (year) => {
        const presetRange = getPresetYearRange();
        let startYear = year;
        let endYear = year;

        if (presetRange) {
            startYear = presetRange.start;
            endYear = presetRange.end;

            if (year < presetRange.start) {
                startYear = year;
            } else if (year > presetRange.end) {
                endYear = year;
            } else if (presetRange.start === presetRange.end) {
                onDateRangeChange({ start: null, end: null });
                setCurrentMonth(new Date());
                return;
            } else if (year === presetRange.start) {
                startYear += 1;
            } else if (year === presetRange.end) {
                endYear -= 1;
            } else {
                return;
            }
        }

        onDateRangeChange({
            start: `${startYear}-01-01`,
            end: `${endYear}-12-31`
        });

        if (year === currentYear) {
            setCurrentMonth(new Date());
        } else {
            setCurrentMonth(new Date(year, 0, 1));
        }
    };

    const isRangeActive = Boolean(dateRange?.start || dateRange?.end);

    const formattedLabel = useMemo(() => {
        if (dateRange?.start && dateRange?.end) {
            const start = parseISO(dateRange.start);
            const end = parseISO(dateRange.end);
            if (isValid(start) && isValid(end)) {
                if (dateRange.start === dateRange.end) {
                    return format(start, "LLL dd, yyyy");
                }
                if (start.getFullYear() === end.getFullYear()) {
                    return `${format(start, "LLL dd")} - ${format(end, "LLL dd, yyyy")}`;
                }
                return `${format(start, "LLL dd, yyyy")} - ${format(end, "LLL dd, yyyy")}`;
            }
        }
        if (dateRange?.start) {
            const start = parseISO(dateRange.start);
            if (isValid(start)) {
                return `From ${format(start, "LLL dd, yyyy")}`;
            }
        }
        if (dateRange?.end) {
            const end = parseISO(dateRange.end);
            if (isValid(end)) {
                return `Until ${format(end, "LLL dd, yyyy")}`;
            }
        }
        return "Choose dates";
    }, [dateRange]);

    return (
        <div className="relative font-['Nunito_Sans']" ref={containerRef}>
            {/* Trigger Button */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsOpen((prev) => !prev);
                    }
                }}
                className={`flex h-12 w-[272px] shrink-0 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 cursor-pointer select-none hover:border-stone-300 ${
                    isOpen ? "ring-2 ring-stone-900/10 shadow-md" : ""
                }`}
                title="Filter by tournament dates"
            >
                <FontAwesomeIcon
                    icon={faCalendarDays}
                    className={`shrink-0 text-xs ${
                        isRangeActive ? "text-stone-700" : "text-stone-400"
                    }`}
                />

                <span
                    className="min-w-0 flex-1 truncate font-['Nunito_Sans'] text-sm font-medium text-stone-700 transition-colors"
                >
                    {formattedLabel}
                </span>

                {isRangeActive ? (
                    <button
                        type="button"
                        onClick={handleClearDates}
                        title="Clear date filter"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                    </button>
                ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`text-[9px] text-stone-500 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </span>
                )}
            </div>

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[272px] rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl transition-all duration-150 animate-fadeIn">
                    {/* 4 Year Presets */}
                    <div className="grid grid-cols-4 gap-1.5 pb-2.5 border-b border-stone-100 w-full">
                        {yearPresets.map((year) => {
                            const active = isYearPresetActive(year);
                            const isCurrentYear = year === currentYear;
                            return (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => handleYearPresetClick(year)}
                                    className={`py-1 rounded-lg text-xs font-medium transition-colors text-center ${
                                        active
                                            ? "bg-stone-900 text-white font-semibold shadow-sm"
                                            : isCurrentYear
                                            ? "bg-stone-200 text-stone-900 ring-1 ring-inset ring-stone-300 hover:bg-stone-300"
                                            : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                                    }`}
                                >
                                    {year}
                                </button>
                            );
                        })}
                    </div>

                    {/* Shadcn UI DayPicker Calendar */}
                    <div className="pt-1">
                        <Calendar
                            mode="range"
                            selected={selectedRange}
                            onSelect={handleCalendarSelect}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            numberOfMonths={1}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}

export default DateRangePicker;

