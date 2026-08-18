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