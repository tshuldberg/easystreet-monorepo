/**
 * Dynamically calculates SF public holidays for any year.
 * Ported from HolidayCalculator.swift.
 *
 * SFMTA enforces sweeping on Juneteenth but suspends it the day after Thanksgiving.
 * 11 SF holidays total.
 */

const holidayCache = new Map<number, Date[]>();

/** Returns all SF public holidays for the given year. */
export function getHolidays(year: number): Date[] {
    const cached = holidayCache.get(year);
    if (cached) return cached;

    const result: Date[] = [];

    // Fixed holidays (with observed-date shifting for weekends)
    result.push(observedDate(new Date(year, 0, 1)));   // New Year's Day
    result.push(observedDate(new Date(year, 6, 4)));   // Independence Day
    result.push(observedDate(new Date(year, 10, 11))); // Veterans Day
    result.push(observedDate(new Date(year, 11, 25))); // Christmas

    // Floating holidays
    result.push(nthWeekdayInMonth(3, 1, 0, year));  // MLK Day (3rd Monday Jan)
    result.push(nthWeekdayInMonth(3, 1, 1, year));  // Presidents' Day (3rd Monday Feb)
    result.push(lastWeekdayInMonth(1, 4, year));     // Memorial Day (last Monday May)
    result.push(nthWeekdayInMonth(1, 1, 8, year));  // Labor Day (1st Monday Sep)
    result.push(nthWeekdayInMonth(2, 1, 9, year));  // Indigenous Peoples' Day (2nd Monday Oct)

    const thanksgiving = nthWeekdayInMonth(4, 4, 10, year); // Thanksgiving (4th Thursday Nov)
    result.push(thanksgiving);

    // Day after Thanksgiving
    const dayAfter = new Date(thanksgiving);
    dayAfter.setDate(dayAfter.getDate() + 1);
    result.push(dayAfter);

    holidayCache.set(year, result);
    return result;
}

/** Check whether a given date falls on any SF public holiday. */
export function isHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const holidays = getHolidays(year);
    if (holidays.some((h) => isSameDay(h, date))) return true;

    // Check if next year's New Year's is observed in this year's December
    if (date.getMonth() === 11) {
        const nextYearHolidays = getHolidays(year + 1);
        return nextYearHolidays.some((h) => isSameDay(h, date));
    }
    return false;
}

/** Clear the holiday cache (useful for testing). */
export function clearHolidayCache(): void {
    holidayCache.clear();
}

// --- Private helpers ---

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/**
 * Returns the observed date for a fixed holiday.
 * Saturday → Friday, Sunday → Monday (per SFMTA convention).
 */
function observedDate(date: Date): Date {
    const day = date.getDay(); // 0=Sun, 6=Sat
    if (day === 6) {
        // Saturday → Friday
        const observed = new Date(date);
        observed.setDate(observed.getDate() - 1);
        return observed;
    }
    if (day === 0) {
        // Sunday → Monday
        const observed = new Date(date);
        observed.setDate(observed.getDate() + 1);
        return observed;
    }
    return date;
}

/**
 * Returns the nth occurrence of a weekday in a given month/year.
 * @param nth - 1-based occurrence (e.g., 3 = third)
 * @param weekday - JS day: 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param month - JS month: 0=January, ..., 11=December
 * @param year - Full year
 */
function nthWeekdayInMonth(
    nth: number,
    weekday: number,
    month: number,
    year: number,
): Date {
    const firstOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstOfMonth.getDay();
    let dayOffset = weekday - firstDayOfWeek;
    if (dayOffset < 0) dayOffset += 7;
    const day = 1 + dayOffset + (nth - 1) * 7;
    return new Date(year, month, day);
}

/**
 * Returns the last occurrence of a weekday in a given month/year.
 * @param weekday - JS day: 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param month - JS month: 0=January, ..., 11=December
 * @param year - Full year
 */
function lastWeekdayInMonth(
    weekday: number,
    month: number,
    year: number,
): Date {
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const lastDayOfWeek = lastDay.getDay();
    let diff = lastDayOfWeek - weekday;
    if (diff < 0) diff += 7;
    const result = new Date(lastDay);
    result.setDate(result.getDate() - diff);
    return result;
}
