"use client";

import { useState, useEffect } from "react";

/** Generate or retrieve a stable anonymous device ID from localStorage. */
export function useDeviceId(): string | null {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        const STORAGE_KEY = "easystreet_device_id";
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, id);
        }
        setDeviceId(id);
    }, []);

    return deviceId;
}
