/**
 * Core sweeping rule evaluation engine.
 * Ported from SweepingRuleEngine.swift and StreetSweepingData.swift.
 */

import { isHoliday } from "./holidayCalculator";
import type { SweepingRule, SweepingStatus, MapColorStatus } from "./types";

/**
 * Check if a sweeping rule applies to the given date.
 * Matches Swift SweepingRule.appliesTo(date:).
 */
export function ruleAppliesTo(rule: SweepingRule, date: Date): boolean {
    // dayOfWeek: 1=Sunday in our model, JS getDay() returns 0=Sunday
    const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const ruleDay = jsDay + 1; // Convert to 1=Sun, 2=Mon, ..., 7=Sat
    if (ruleDay !== rule.dayOfWeek) return false;

    // Check week of month if specified
    if (rule.weeksOfMonth.length > 0) {
        const dayOfMonth = date.getDate();
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        if (!rule.weeksOfMonth.includes(weekOfMonth)) return false;
    }

    // Check holiday: if rule doesn't apply on holidays and it IS a holiday, skip
    if (!rule.applyOnHolidays && isHoliday(date)) return false;

    return true;
}

/** Parse "HH:MM" time string into hours and minutes. */
function parseTime(time: string): { hours: number; minutes: number } | null {
    const parts = time.split(":");
    if (parts.length !== 2) return null;
    const hours = parseInt(parts[0]!, 10);
    const minutes = parseInt(parts[1]!, 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
}

/** Create a Date on the same day as `date` but at the given hour:minute. */
function setTimeOnDate(date: Date, hours: number, minutes: number): Date {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

/**
 * Determine sweeping status for a set of rules at a given time.
 * Matches Swift SweepingRuleEngine.determineStatus(for:at:).
 */
export function getStatus(
    rules: SweepingRule[],
    streetName: string,
    at: Date = new Date(),
): SweepingStatus {
    if (rules.length === 0) return { type: "noData" };

    const todaySweepWindows: Array<{ start: Date; end: Date }> = [];
    let hadParseError = false;

    for (const rule of rules) {
        if (!ruleAppliesTo(rule, at)) continue;

        const startParsed = parseTime(rule.startTime);
        const endParsed = parseTime(rule.endTime);
        if (!startParsed || !endParsed) {
            hadParseError = true;
            continue;
        }

        const sweepStart = setTimeOnDate(at, startParsed.hours, startParsed.minutes);
        const sweepEnd = setTimeOnDate(at, endParsed.hours, endParsed.minutes);
        todaySweepWindows.push({ start: sweepStart, end: sweepEnd });
    }

    if (todaySweepWindows.length === 0 && hadParseError) {
        return { type: "unknown" };
    }

    const activeSweep = todaySweepWindows
        .filter((window) => at >= window.start && at < window.end)
        .sort((a, b) => a.end.getTime() - b.end.getTime())[0];
    if (activeSweep) {
        return { type: "activeNow", streetName, endTime: activeSweep.end };
    }

    const nextTodaySweep = todaySweepWindows
        .filter((window) => window.start > at)
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    if (nextTodaySweep) {
        const msRemaining = nextTodaySweep.start.getTime() - at.getTime();
        const hoursRemaining = msRemaining / (1000 * 60 * 60);

        if (hoursRemaining < 1) {
            return { type: "imminent", time: nextTodaySweep.start, streetName };
        }
        return { type: "today", time: nextTodaySweep.start, streetName };
    }

    const nextSweep = getNextSweepingTime(rules, at);
    if (nextSweep) {
        return { type: "upcoming", time: nextSweep, streetName };
    }
    return { type: "safe" };
}

/**
 * Find the next sweeping time after a given date.
 * Checks up to 180 days in the future.
 */
export function getNextSweepingTime(
    rules: SweepingRule[],
    after: Date = new Date(),
): Date | null {
    let earliest: Date | null = null;

    for (const rule of rules) {
        const startParsed = parseTime(rule.startTime);
        if (!startParsed) continue;

        const today = new Date(after);
        today.setHours(0, 0, 0, 0);
        if (ruleAppliesTo(rule, today)) {
            const todaySweepStart = setTimeOnDate(
                today,
                startParsed.hours,
                startParsed.minutes,
            );
            if (
                todaySweepStart > after &&
                (!earliest || todaySweepStart < earliest)
            ) {
                earliest = todaySweepStart;
            }
        }

        for (let dayOffset = 1; dayOffset <= 180; dayOffset++) {
            const checkDate = new Date(after);
            checkDate.setDate(checkDate.getDate() + dayOffset);
            checkDate.setHours(0, 0, 0, 0); // Normalize to start of day

            if (ruleAppliesTo(rule, checkDate)) {
                const sweepDate = setTimeOnDate(
                    checkDate,
                    startParsed.hours,
                    startParsed.minutes,
                );
                if (!earliest || sweepDate < earliest) {
                    earliest = sweepDate;
                }
                break; // Found soonest for this rule
            }
        }
    }

    return earliest;
}

/**
 * Get map color status for a set of rules.
 * Matches Swift StreetSegment.mapColorStatus().
 */
export function getMapColorStatus(
    rules: SweepingRule[],
    referenceDate: Date = new Date(),
): MapColorStatus {
    if (rules.length === 0) return "gray";

    // Check today
    if (rules.some((rule) => ruleAppliesTo(rule, referenceDate))) {
        return "red";
    }

    // Check next 3 days
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
        const futureDate = new Date(referenceDate);
        futureDate.setDate(futureDate.getDate() + dayOffset);
        if (rules.some((rule) => ruleAppliesTo(rule, futureDate))) {
            return dayOffset === 1 ? "orange" : "yellow";
        }
    }

    return "green";
}
