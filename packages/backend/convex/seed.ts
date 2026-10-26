"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { parseScheduleCSV } from "../../shared/src/scheduleParser";

/**
 * Seed the database from the CSV file. Parsing is shared with the apps and the
 * native repo's pipeline: one segment per block side, holiday rows kept as
 * holiday rules.
 * This action reads the CSV content passed as an argument (since Convex actions can't read local files,
 * you'll need to call this with the CSV content or use a file upload approach).
 *
 * For local development, run: npx convex run seed:seedFromCSV
 */
export const seedFromCSV = action({
    args: { csvContent: v.string() },
    handler: async (ctx, args) => {
        const { segments: parsed, stats } = parseScheduleCSV(args.csvContent);
        console.log(
            `Parsed ${stats.rows} rows into ${stats.segments} block sides, ` +
                `${stats.rules} rules (${stats.holidayRules} holiday rules)`,
        );

        const segments = parsed.map((seg) => ({
            segmentId: seg.segmentId,
            cnn: seg.cnn,
            streetName: seg.streetName,
            blockSide: seg.blockSide,
            limits: seg.limits,
            coordinates: seg.coordinates,
            bounds: seg.bounds,
            rules: seg.rules,
        }));

        // Batch insert — Convex mutations handle up to ~8000 rows, so batch at 100
        const BATCH_SIZE = 100;
        let inserted = 0;
        for (let i = 0; i < segments.length; i += BATCH_SIZE) {
            const batch = segments.slice(i, i + BATCH_SIZE);
            await ctx.runMutation(internal.seed.insertBatch, { segments: batch });
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
                        kind: v.optional(v.union(v.literal("weekly"), v.literal("holiday"))),
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
