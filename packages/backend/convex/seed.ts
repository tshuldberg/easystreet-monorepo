"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

/**
 * Maps CSV weekday abbreviations to our dayOfWeek numbers (1=Sunday, 7=Saturday).
 */
const WEEKDAY_MAP: Record<string, number> = {
    Sun: 1,
    Mon: 2,
    Tues: 3, // CSV uses "Tues" not "Tue"
    Tue: 3,
    Wed: 4,
    Thu: 5,
    Thurs: 5,
    Fri: 6,
    Sat: 7,
};

interface RawRow {
    CNN: string;
    Corridor: string;
    Limits: string;
    CNNRightLeft: string;
    BlockSide: string;
    FullName: string;
    WeekDay: string;
    FromHour: string;
    ToHour: string;
    Week1: string;
    Week2: string;
    Week3: string;
    Week4: string;
    Week5: string;
    Holidays: string;
    BlockSweepID: string;
    Line: string;
}

/** Parse a LINESTRING WKT into an array of {latitude, longitude} objects. */
function parseLineString(
    wkt: string,
): { latitude: number; longitude: number }[] {
    const match = wkt.match(/LINESTRING\s*\((.+)\)/);
    if (!match?.[1]) return [];
    return match[1].split(",").map((pair) => {
        const parts = pair.trim().split(/\s+/);
        const lng = parseFloat(parts[0] ?? "0");
        const lat = parseFloat(parts[1] ?? "0");
        return { latitude: lat, longitude: lng };
    });
}

/** Compute bounding box from coordinates. */
function computeBounds(
    coords: { latitude: number; longitude: number }[],
): { latMin: number; latMax: number; lngMin: number; lngMax: number } {
    let latMin = Infinity;
    let latMax = -Infinity;
    let lngMin = Infinity;
    let lngMax = -Infinity;
    for (const c of coords) {
        if (c.latitude < latMin) latMin = c.latitude;
        if (c.latitude > latMax) latMax = c.latitude;
        if (c.longitude < lngMin) lngMin = c.longitude;
        if (c.longitude > lngMax) lngMax = c.longitude;
    }
    return { latMin, latMax, lngMin, lngMax };
}

/** Parse the CSV into grouped segments. */
function parseCSV(csvText: string): Map<string, RawRow[]> {
    const lines = csvText.split("\n");
    const header = lines[0];
    if (!header) return new Map();

    const columns = header.split(",").map((h) => h.replace(/"/g, "").trim());
    const groups = new Map<string, RawRow[]>();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;

        // Simple CSV parsing that handles quoted fields
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row: Record<string, string> = {};
        columns.forEach((col, idx) => {
            row[col] = values[idx] ?? "";
        });

        const blockSweepId = row["BlockSweepID"] ?? "";
        if (!blockSweepId) continue;

        const existing = groups.get(blockSweepId) ?? [];
        existing.push(row as unknown as RawRow);
        groups.set(blockSweepId, existing);
    }

    return groups;
}

/**
 * Seed the database from the CSV file.
 * This action reads the CSV content passed as an argument (since Convex actions can't read local files,
 * you'll need to call this with the CSV content or use a file upload approach).
 *
 * For local development, run: npx convex run seed:seedFromCSV
 */
export const seedFromCSV = action({
    args: { csvContent: v.string() },
    handler: async (ctx, args) => {
        const groups = parseCSV(args.csvContent);
        console.log(`Parsed ${groups.size} unique BlockSweepIDs`);

        const segments: Array<{
            segmentId: string;
            cnn: string;
            streetName: string;
            blockSide: string;
            limits: string;
            coordinates: { latitude: number; longitude: number }[];
            bounds: {
                latMin: number;
                latMax: number;
                lngMin: number;
                lngMax: number;
            };
            rules: {
                dayOfWeek: number;
                startTime: string;
                endTime: string;
                weeksOfMonth: number[];
                applyOnHolidays: boolean;
            }[];
        }> = [];

        for (const [blockSweepId, rows] of groups) {
            const firstRow = rows[0];
            if (!firstRow) continue;

            const coordinates = parseLineString(firstRow.Line);
            if (coordinates.length === 0) continue;

            const bounds = computeBounds(coordinates);

            // Build rules from all rows in this group
            const rules = rows.map((row) => {
                const dayOfWeek = WEEKDAY_MAP[row.WeekDay] ?? 0;
                const fromHour = parseInt(row.FromHour, 10);
                const toHour = parseInt(row.ToHour, 10);
                const startTime = `${String(fromHour).padStart(2, "0")}:00`;
                const endTime = `${String(toHour).padStart(2, "0")}:00`;

                const weeksOfMonth: number[] = [];
                if (row.Week1 === "1") weeksOfMonth.push(1);
                if (row.Week2 === "1") weeksOfMonth.push(2);
                if (row.Week3 === "1") weeksOfMonth.push(3);
                if (row.Week4 === "1") weeksOfMonth.push(4);
                if (row.Week5 === "1") weeksOfMonth.push(5);

                // If all weeks are selected, treat as "every week" (empty array)
                const allWeeks =
                    weeksOfMonth.length === 5 ||
                    (weeksOfMonth.length === 4 &&
                        weeksOfMonth.includes(1) &&
                        weeksOfMonth.includes(2) &&
                        weeksOfMonth.includes(3) &&
                        weeksOfMonth.includes(4));

                return {
                    dayOfWeek,
                    startTime,
                    endTime,
                    weeksOfMonth: allWeeks ? [] : weeksOfMonth,
                    applyOnHolidays: row.Holidays === "1",
                };
            });

            // Deduplicate rules
            const uniqueRules = rules.filter(
                (rule, index, self) =>
                    index ===
                    self.findIndex(
                        (r) =>
                            r.dayOfWeek === rule.dayOfWeek &&
                            r.startTime === rule.startTime &&
                            r.endTime === rule.endTime &&
                            JSON.stringify(r.weeksOfMonth) ===
                                JSON.stringify(rule.weeksOfMonth) &&
                            r.applyOnHolidays === rule.applyOnHolidays,
                    ),
            );

            segments.push({
                segmentId: blockSweepId,
                cnn: firstRow.CNN,
                streetName: firstRow.Corridor,
                blockSide: firstRow.BlockSide,
                limits: firstRow.Limits,
                coordinates,
                bounds,
                rules: uniqueRules,
            });
        }

        // Batch insert — Convex mutations handle up to ~8000 rows, so batch at 100
        const BATCH_SIZE = 100;
        let inserted = 0;
        for (let i = 0; i < segments.length; i += BATCH_SIZE) {
            const batch = segments.slice(i, i + BATCH_SIZE);
            await ctx.runMutation(api.seed.insertBatch, { segments: batch });
            inserted += batch.length;
            if (inserted % 1000 === 0) {
                console.log(`Inserted ${inserted}/${segments.length} segments...`);
            }
        }

        console.log(`Seeding complete: ${inserted} segments inserted.`);
        return { inserted };
    },
});

/** Internal mutation to insert a batch of segments. */
import { internalMutation } from "./_generated/server";

export const insertBatch = internalMutation({
    args: {
        segments: v.array(
            v.object({
                segmentId: v.string(),
                cnn: v.string(),
                streetName: v.string(),
                blockSide: v.string(),
                limits: v.string(),
                coordinates: v.array(
                    v.object({
                        latitude: v.number(),
                        longitude: v.number(),
                    }),
                ),
                bounds: v.object({
                    latMin: v.number(),
                    latMax: v.number(),
                    lngMin: v.number(),
                    lngMax: v.number(),
                }),
                rules: v.array(
                    v.object({
                        dayOfWeek: v.number(),
                        startTime: v.string(),
                        endTime: v.string(),
                        weeksOfMonth: v.array(v.number()),
                        applyOnHolidays: v.boolean(),
                    }),
                ),
            }),
        ),
    },
    handler: async (ctx, args) => {
        for (const segment of args.segments) {
            await ctx.db.insert("streetSegments", segment);
        }
    },
});
