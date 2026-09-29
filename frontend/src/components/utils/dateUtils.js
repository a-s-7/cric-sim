export const ordinal = (n) => {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;

    const suffix = ["th", "st", "nd", "rd"][n % 10] || "th";
    return `${n}${suffix}`;
};


export const timeZone = "America/Los_Angeles";

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" });
const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone, month: "short" });
const yearFmt = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" });

export const formatTestDateRange = (date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 4);


    const startDay = dayFmt.format(start);
    const endDay = dayFmt.format(end);
    const startMonth = monthFmt.format(start);
    const endMonth = monthFmt.format(end);
    const year = yearFmt.format(end);

    if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }

    return `${startMonth} ${startDay}–${endMonth} ${endDay}, ${year}`;
};

export const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = start.getMonth() === end.getMonth();

    const startMonth = start.toLocaleDateString("en-US", {
        month: "short"
    });

    const endMonth = end.toLocaleDateString("en-US", {
        month: "short"
    });

    const startDay = start.getDate();
    const endDay = end.getDate();

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    // Same month and same year
    // Jun 11 - 19, 2026
    if (sameYear && sameMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
    }

    // Different month, same year
    // Jun 11 - Jul 19, 2026
    if (sameYear) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    }

    // Different years
    // Jun 11, 2025 - Jul 19, 2026
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
};