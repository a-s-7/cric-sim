import * as React from "react";
import { DayPicker } from "react-day-picker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export function Calendar({
    className = "",
    classNames = {},
    showOutsideDays = true,
    ...props
}) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={className}
            classNames={{
                months: "flex flex-col space-y-3",
                month: "space-y-3",
                caption: "flex justify-center pt-1 relative items-center mb-1",
                caption_label: "text-xs font-bold text-stone-800",
                nav: "space-x-1 flex items-center",
                nav_button:
                    "h-7 w-7 bg-transparent p-0 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg flex items-center justify-center transition-colors",
                nav_button_previous: "absolute left-0",
                nav_button_next: "absolute right-0",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-between",
                head_cell:
                    "text-stone-500 rounded-md w-9 font-semibold text-[11px] text-center",
                row: "flex w-full mt-1 justify-between",
                cell: "h-9 w-9 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-stone-100/50 [&:has([aria-selected])]:bg-stone-100 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-medium aria-selected:opacity-100 rounded-lg hover:bg-stone-100 transition-colors flex items-center justify-center text-xs text-stone-700",
                day_range_start:
                    "day-range-start bg-stone-900 text-white hover:bg-stone-900 hover:text-white rounded-l-lg rounded-r-none font-semibold shadow-sm",
                day_range_end:
                    "day-range-end bg-stone-900 text-white hover:bg-stone-900 hover:text-white rounded-r-lg rounded-l-none font-semibold shadow-sm",
                day_selected:
                    "bg-stone-900 text-white hover:bg-stone-900 hover:text-white focus:bg-stone-900 focus:text-white font-semibold",
                day_today: "bg-stone-100 text-stone-900 font-bold ring-1 ring-inset ring-stone-300",
                day_outside:
                    "day-outside text-stone-300 opacity-40 aria-selected:bg-stone-100/50 aria-selected:text-stone-400",
                day_disabled: "text-stone-300 opacity-40",
                day_range_middle:
                    "aria-selected:bg-stone-100 aria-selected:text-stone-900 rounded-none font-normal",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: () => <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />,
                IconRight: () => <FontAwesomeIcon icon={faChevronRight} className="text-xs" />,
            }}
            {...props}
        />
    );
}

export default Calendar;

