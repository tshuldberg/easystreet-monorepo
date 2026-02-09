import { describe, expect, it } from "vitest";
import { getNextSweepingTime, getStatus } from "./sweepingRuleEngine";
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
});
