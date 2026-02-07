import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "easystreet_device_id";

/** Generate a simple UUID v4. */
function generateId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/** Generate or retrieve a stable anonymous device ID from secure storage. */
export function useDeviceId(): string | null {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let id = await SecureStore.getItemAsync(STORAGE_KEY);
            if (!id) {
                id = generateId();
                await SecureStore.setItemAsync(STORAGE_KEY, id);
            }
            setDeviceId(id);
        })();
    }, []);

    return deviceId;
}
