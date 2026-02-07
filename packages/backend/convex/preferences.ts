import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get user preferences for a device. */
export const getPreferences = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("userPreferences")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();
    },
});

/** Set user preferences (upsert). */
export const setPreferences = mutation({
    args: {
        deviceId: v.string(),
        hasSeenDisclaimer: v.optional(v.boolean()),
        notificationLeadMinutes: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("userPreferences")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (existing) {
            const updates: Record<string, unknown> = {};
            if (args.hasSeenDisclaimer !== undefined) {
                updates.hasSeenDisclaimer = args.hasSeenDisclaimer;
            }
            if (args.notificationLeadMinutes !== undefined) {
                updates.notificationLeadMinutes = args.notificationLeadMinutes;
            }
            await ctx.db.patch(existing._id, updates);
            return existing._id;
        }

        return await ctx.db.insert("userPreferences", {
            deviceId: args.deviceId,
            hasSeenDisclaimer: args.hasSeenDisclaimer ?? false,
            notificationLeadMinutes: args.notificationLeadMinutes ?? 60,
        });
    },
});
