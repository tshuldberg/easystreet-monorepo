import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get street segments within a bounding box (for map viewport). */
export const getSegmentsInBounds = query({
    args: {
        latMin: v.number(),
        latMax: v.number(),
        lngMin: v.number(),
        lngMax: v.number(),
    },
    handler: async (ctx, args) => {
        // Use bounds fields for filtering — Convex lacks native geo indexes,
        // so we query all and filter. The .take(500) cap prevents overloading.
        const segments = await ctx.db
            .query("streetSegments")
            .filter((q) =>
                q.and(
                    q.lte(q.field("bounds.latMin"), args.latMax),
                    q.gte(q.field("bounds.latMax"), args.latMin),
                    q.lte(q.field("bounds.lngMin"), args.lngMax),
                    q.gte(q.field("bounds.lngMax"), args.lngMin),
                ),
            )
            .take(500);
        return segments;
    },
});

/** Get a single segment by its segmentId. */
export const getSegmentById = query({
    args: { segmentId: v.string() },
    handler: async (ctx, args) => {
        const segment = await ctx.db
            .query("streetSegments")
            .withIndex("by_segmentId", (q) => q.eq("segmentId", args.segmentId))
            .first();
        return segment;
    },
});

/** Full-text search for streets by name. */
export const searchStreets = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query.trim()) return [];
        const results = await ctx.db
            .query("streetSegments")
            .withSearchIndex("search_streetName", (q) =>
                q.search("streetName", args.query),
            )
            .take(10);
        return results;
    },
});

/** Find the nearest segment to a given location using bounding box + distance calc. */
export const findNearestSegment = query({
    args: {
        latitude: v.number(),
        longitude: v.number(),
    },
    handler: async (ctx, args) => {
        // Search in a small bounding box around the point (~0.005 degrees ≈ 500m)
        const delta = 0.005;
        const candidates = await ctx.db
            .query("streetSegments")
            .filter((q) =>
                q.and(
                    q.lte(q.field("bounds.latMin"), args.latitude + delta),
                    q.gte(q.field("bounds.latMax"), args.latitude - delta),
                    q.lte(q.field("bounds.lngMin"), args.longitude + delta),
                    q.gte(q.field("bounds.lngMax"), args.longitude - delta),
                ),
            )
            .take(100);

        if (candidates.length === 0) return null;

        // Find closest by Euclidean distance to any coordinate point
        let closest = candidates[0]!;
        let minDist = Infinity;

        for (const segment of candidates) {
            for (const coord of segment.coordinates) {
                const dLat = coord.latitude - args.latitude;
                const dLng = coord.longitude - args.longitude;
                const dist = dLat * dLat + dLng * dLng;
                if (dist < minDist) {
                    minDist = dist;
                    closest = segment;
                }
            }
        }

        return closest;
    },
});
