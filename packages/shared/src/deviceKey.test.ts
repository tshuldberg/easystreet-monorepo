import { describe, expect, it } from "vitest";
import { generateDeviceKey, hashDeviceKey, isValidDeviceKey } from "./deviceKey";

describe("device keys", () => {
    it("accepts 128-bit keys and UUIDs, rejects short or non-hex ids", () => {
        expect(isValidDeviceKey("0123456789abcdef0123456789abcdef")).toBe(true);
        expect(isValidDeviceKey("3f2b8a6c-1d2e-4f00-9a8b-7c6d5e4f3a2b")).toBe(true);
        expect(isValidDeviceKey("device-1")).toBe(false);
        expect(isValidDeviceKey("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
    });

    it("generates 32 hex characters from the random source", () => {
        const key = generateDeviceKey((a) => a.fill(0xab));
        expect(key).toBe("ab".repeat(16));
        expect(isValidDeviceKey(key)).toBe(true);
    });

    it("hashes deterministically and normalizes case and dashes", async () => {
        const a = await hashDeviceKey("3F2B8A6C-1D2E-4F00-9A8B-7C6D5E4F3A2B");
        const b = await hashDeviceKey("3f2b8a6c1d2e4f009a8b7c6d5e4f3a2b");
        expect(a).toBe(b);
        expect(a).toMatch(/^[0-9a-f]{64}$/);
        expect(a).not.toContain("3f2b8a6c");
    });

    it("refuses to hash an invalid key", async () => {
        await expect(hashDeviceKey("short")).rejects.toThrow("Invalid device key");
    });
});
