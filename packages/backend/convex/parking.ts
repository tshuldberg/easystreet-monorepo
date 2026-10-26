import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashDeviceKey } from "../../shared/src/deviceKey";

/** Get the current parked car for a device. */
export const getParkedCar = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        // Only the SHA-256 of the device key is stored or compared.
        const owner = await hashDeviceKey(args.deviceId);
        return await ctx.db
            .query("parkedCars")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", owner))
            .first();
    },
});

/** Park a car (upsert — replaces existing entry for device). */
export const parkCar = mutation({
    args: {
        deviceId: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        streetName: v.optional(v.string()),
        notificationLeadMinutes: v.number(),
        notificationLeadMinutesSet: v.optional(v.array(v.number())),
        segmentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Only the SHA-256 of the device key is stored or compared.
        const owner = await hashDeviceKey(args.deviceId);
        // Remove existing parked car for this device
        const existing = await ctx.db
            .query("parkedCars")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", owner))
            .first();
        if (existing) {
            await ctx.db.delete(existing._id);
        }

        // Insert new
        return await ctx.db.insert("parkedCars", {
            deviceId: owner,
            latitude: args.latitude,
            longitude: args.longitude,
            streetName: args.streetName,
            parkedAt: Date.now(),
            notificationLeadMinutes: args.notificationLeadMinutes,
            notificationLeadMinutesSet: args.notificationLeadMinutesSet,
            segmentId: args.segmentId,
        });
    },
});

/** Update parked car location (for manual pin adjustment). */
export const updateParkedLocation = mutation({
    args: {
        deviceId: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        streetName: v.optional(v.string()),
        segmentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Only the SHA-256 of the device key is stored or compared.
        const owner = await hashDeviceKey(args.deviceId);
        const existing = await ctx.db
            .query("parkedCars")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", owner))
            .first();
        if (!existing) return null;

        await ctx.db.patch(existing._id, {
            latitude: args.latitude,
            longitude: args.longitude,
            streetName: args.streetName,
            segmentId: args.segmentId,
        });
        return existing._id;
    },
});

/** Clear (remove) the parked car for a device. */
export const clearParkedCar = mutation({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        // Only the SHA-256 of the device key is stored or compared.
        const owner = await hashDeviceKey(args.deviceId);
        const existing = await ctx.db
            .query("parkedCars")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", owner))
            .first();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});
