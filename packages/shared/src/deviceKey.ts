/**
 * Anonymous device keys for the optional server sync of parking state.
 *
 * The key is a 128-bit random capability: whoever holds it can read and write
 * that device's parked car, so it is generated from a secure random source and
 * the backend stores only its SHA-256 hash (a database leak does not reveal
 * keys, and a guessed short id is rejected).
 */

/** Keys are at least 32 hex characters (128 bits); UUIDs qualify once dashes are removed. */
export function isValidDeviceKey(key: string): boolean {
    const compact = key.replace(/-/g, "");
    return /^[0-9a-fA-F]{32,128}$/.test(compact);
}

/** 32 lowercase hex characters from the given random source. */
export function generateDeviceKey(getRandomValues: (array: Uint8Array) => Uint8Array): string {
    const bytes = getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hex SHA-256 of the normalized key (Web Crypto; available in Convex, browsers and Node 18+). */
export async function hashDeviceKey(key: string): Promise<string> {
    if (!isValidDeviceKey(key)) {
        throw new Error("Invalid device key");
    }
    const normalized = key.replace(/-/g, "").toLowerCase();
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
