import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { generateDeviceKey, isValidDeviceKey } from "@repo/shared";

const STORAGE_KEY = "easystreet_device_id";

/**
 * A 128-bit device key from a secure random source. It doubles as the local
 * storage namespace and, if server sync is ever enabled, as the capability the
 * backend checks (it stores only a hash).
 */
function generateId(): string {
    const cryptoSource = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
    if (cryptoSource?.getRandomValues) {
        return generateDeviceKey((a) => cryptoSource.getRandomValues!(a));
    }
    // No secure source: the key is then only a local storage namespace, because
    // server sync (PARKING_SERVER_SYNC) is off and the backend refuses weak keys.
    return generateDeviceKey((a) => a.map(() => Math.floor(Math.random() * 256)));
}

/** Generate or retrieve a stable anonymous device ID from secure storage. */
export function useDeviceId(): string | null {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let id = await SecureStore.getItemAsync(STORAGE_KEY);
            if (!id || !isValidDeviceKey(id)) {
                id = generateId();
                await SecureStore.setItemAsync(STORAGE_KEY, id);
            }
            setDeviceId(id);
        })();
    }, []);

    return deviceId;
}
