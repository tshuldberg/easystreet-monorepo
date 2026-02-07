import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    streetSegments: defineTable({
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
    })
        .index("by_segmentId", ["segmentId"])
        .index("by_streetName", ["streetName"])
        .searchIndex("search_streetName", {
            searchField: "streetName",
        }),

    parkedCars: defineTable({
        deviceId: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        streetName: v.optional(v.string()),
        parkedAt: v.number(),
        notificationLeadMinutes: v.number(),
        segmentId: v.optional(v.string()),
    }).index("by_deviceId", ["deviceId"]),

    userPreferences: defineTable({
        deviceId: v.string(),
        hasSeenDisclaimer: v.boolean(),
        notificationLeadMinutes: v.number(),
    }).index("by_deviceId", ["deviceId"]),
});
