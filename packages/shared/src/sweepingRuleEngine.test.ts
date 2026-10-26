import { describe, expect, it } from "vitest";
import { getMapColorStatus, getNextSweepingTime, getStatus, ruleAppliesTo } from "./sweepingRuleEngine";
import type { SweepingRule } from "./types";

function atLocal(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
): Date {
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

describe("sweepingRuleEngine", () => {
    it("includes same-day sweeps in next sweep lookup", () => {
        const rules: SweepingRule[] = [
            {
                dayOfWeek: 2, // Monday
                startTime: "09:00",
                endTime: "11:00",
                weeksOfMonth: [],
                applyOnHolidays: true,
            },
        ];

        const now = atLocal(2026, 3, 2, 8, 0); // Monday
        const next = getNextSweepingTime(rules, now);

        expect(next).not.toBeNull();
        expect(next?.getFullYear()).toBe(2026);
        expect(next?.getMonth()).toBe(2);
        expect(next?.getDate()).toBe(2);
        expect(next?.getHours()).toBe(9);
        expect(next?.getMinutes()).toBe(0);
    });

    it("chooses the earliest upcoming sweep when today's rules are unsorted", () => {
        const rules: SweepingRule[] = [
            {
                dayOfWeek: 2, // Monday
                startTime: "18:00",
                endTime: "20:00",
                weeksOfMonth: [],
                applyOnHolidays: true,
            },
            {
                dayOfWeek: 2, // Monday
                startTime: "09:00",
                endTime: "11:00",
                weeksOfMonth: [],
                applyOnHolidays: true,
            },
        ];

        const status = getStatus(rules, "Test St", atLocal(2026, 3, 2, 7, 30));

        expect(status.type).toBe("today");
        if (status.type === "today") {
            expect(status.time.getHours()).toBe(9);
            expect(status.time.getMinutes()).toBe(0);
        }
    });

    it("returns activeNow when currently within a sweeping window", () => {
        const rules: SweepingRule[] = [
            {
                dayOfWeek: 2, // Monday
                startTime: "09:00",
                endTime: "11:00",
                weeksOfMonth: [],
                applyOnHolidays: true,
            },
        ];

        const status = getStatus(rules, "Test St", atLocal(2026, 3, 2, 9, 30));

        expect(status.type).toBe("activeNow");
        if (status.type === "activeNow") {
            expect(status.endTime.getHours()).toBe(11);
            expect(status.endTime.getMinutes()).toBe(0);
        }
    });

    it("returns unknown when only malformed today's rules match", () => {
        const rules: SweepingRule[] = [
            {
                dayOfWeek: 2, // Monday
                startTime: "99:00",
                endTime: "10:00",
                weeksOfMonth: [],
                applyOnHolidays: true,
            },
        ];

        const status = getStatus(rules, "Test St", atLocal(2026, 3, 2, 8, 0));
        expect(status.type).toBe("unknown");
    });

    // B1: October 2026 starts on a Thursday, so Monday Oct 5 is the 1st Monday
    // although it sits in the second calendar row.
    it("treats weeksOfMonth as the nth weekday in months that do not start on Sunday", () => {
        const firstAndThirdMonday: SweepingRule = {
            dayOfWeek: 2,
            startTime: "08:00",
            endTime: "10:00",
            weeksOfMonth: [1, 3],
            applyOnHolidays: false,
        };
        expect(ruleAppliesTo(firstAndThirdMonday, atLocal(2026, 10, 5, 9, 0))).toBe(true);
        expect(ruleAppliesTo(firstAndThirdMonday, atLocal(2026, 10, 12, 9, 0))).toBe(false);
        expect(ruleAppliesTo(firstAndThirdMonday, atLocal(2026, 10, 19, 9, 0))).toBe(true);
        expect(ruleAppliesTo(firstAndThirdMonday, atLocal(2026, 10, 26, 9, 0))).toBe(false);
        const fifthMonday = { ...firstAndThirdMonday, weeksOfMonth: [5] };
        expect(ruleAppliesTo(fifthMonday, atLocal(2026, 8, 31, 9, 0))).toBe(true);
    });

    // B2: Christmas 2026 is a Friday. The weekday rule is suspended, the holiday rule is not.
    it("applies holiday rules on holidays and keeps the status from reading safe", () => {
        const rules: SweepingRule[] = [
            { dayOfWeek: 6, startTime: "05:00", endTime: "06:00", weeksOfMonth: [], applyOnHolidays: false },
            { kind: "holiday", dayOfWeek: 0, startTime: "05:00", endTime: "07:00", weeksOfMonth: [], applyOnHolidays: true },
        ];
        const status = getStatus(rules, "Market St", atLocal(2026, 12, 25, 3, 0));
        expect(status.type).toBe("today");
        if (status.type === "today") expect(status.time.getHours()).toBe(5);
        expect(getMapColorStatus(rules, atLocal(2026, 12, 25, 1, 0))).toBe("red");
        const next = getNextSweepingTime([rules[1]!], atLocal(2026, 10, 20, 12, 0));
        expect([next?.getMonth(), next?.getDate(), next?.getHours()]).toEqual([10, 11, 5]); // Veterans Day, Nov 11, 5 AM
    });

    // B3: back-to-back windows merge so the end is when the street is clear.
    it("merges back-to-back windows in the active state", () => {
        const rules: SweepingRule[] = [
            { dayOfWeek: 3, startTime: "06:00", endTime: "08:00", weeksOfMonth: [], applyOnHolidays: true },
            { dayOfWeek: 3, startTime: "08:00", endTime: "10:00", weeksOfMonth: [], applyOnHolidays: true },
        ];
        const status = getStatus(rules, "Valencia St", atLocal(2026, 10, 20, 7, 0));
        expect(status.type).toBe("activeNow");
        if (status.type === "activeNow") expect(status.endTime.getHours()).toBe(10);
    });
});
