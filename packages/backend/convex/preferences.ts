import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashDeviceKey } from "../../shared/src/deviceKey";

/** Get user preferences for a device. */
export const getPreferences = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        // Only the SHA-256 of the device key is stored or compared.
        const owner = await hashDeviceKey(args.deviceId);
        return await ctx.db
            .query("userPreferences")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", owner))
            .first();
    },
});

/** Set user preferences (upsert). */
export const setPreferences = mutation({
    args: {
        deviceId: v.string(),
        hasSeenDisclaimer: v.optional(v.boolean()),
        notificationLeadMinutes: v.optional(v.number()),
        notificationLeadMinutesSet: v.optional(v.array(v.number())),
        activeCityCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Only the SHA-256 of the device key is stored or compared.
        const owner = await hashDeviceKey(args.deviceId);
        const existing = await ctx.db
            .query("userPreferences")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", owner))
            .first();

        if (existing) {
            const updates: Record<string, unknown> = {};
            if (args.hasSeenDisclaimer !== undefined) {
                updates.hasSeenDisclaimer = args.hasSeenDisclaimer;
            }
            if (args.notificationLeadMinutes !== undefined) {
                updates.notificationLeadMinutes = args.notificationLeadMinutes;
            }
            if (args.notificationLeadMinutesSet !== undefined) {
                updates.notificationLeadMinutesSet =
                    args.notificationLeadMinutesSet;
            }
            if (args.activeCityCode !== undefined) {
                updates.activeCityCode = args.activeCityCode;
            }
            await ctx.db.patch(existing._id, updates);
            return existing._id;
        }

        return await ctx.db.insert("userPreferences", {
            deviceId: owner,
            hasSeenDisclaimer: args.hasSeenDisclaimer ?? false,
            notificationLeadMinutes: args.notificationLeadMinutes ?? 60,
            notificationLeadMinutesSet: args.notificationLeadMinutesSet,
            activeCityCode: args.activeCityCode,
        });
    },
});
