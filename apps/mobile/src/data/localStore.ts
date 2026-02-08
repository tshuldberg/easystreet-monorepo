import * as SecureStore from "expo-secure-store";

export interface LocalParkedCarSnapshot {
    latitude: number;
    longitude: number;
    streetName?: string | null;
    parkedAt: number;
    segmentId?: string | null;
}

const PARKED_KEY_PREFIX = "easystreet_parked_snapshot";
const LEADS_KEY_PREFIX = "easystreet_notification_leads";
const NOTIFICATION_IDS_KEY = "easystreet_notification_ids";

async function getJSON<T>(key: string): Promise<T | null> {
    try {
        const raw = await SecureStore.getItemAsync(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

async function setJSON(key: string, value: unknown): Promise<void> {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function loadLocalParkedSnapshot(
    deviceId: string,
): Promise<LocalParkedCarSnapshot | null> {
    return getJSON<LocalParkedCarSnapshot>(`${PARKED_KEY_PREFIX}_${deviceId}`);
}

export async function saveLocalParkedSnapshot(
    deviceId: string,
    snapshot: LocalParkedCarSnapshot | null,
): Promise<void> {
    const key = `${PARKED_KEY_PREFIX}_${deviceId}`;
    if (!snapshot) {
        await SecureStore.deleteItemAsync(key);
        return;
    }
    await setJSON(key, snapshot);
}

export async function loadLocalLeadMinutesSet(
    deviceId: string,
): Promise<number[] | null> {
    return getJSON<number[]>(`${LEADS_KEY_PREFIX}_${deviceId}`);
}

export async function saveLocalLeadMinutesSet(
    deviceId: string,
    leads: number[],
): Promise<void> {
    await setJSON(`${LEADS_KEY_PREFIX}_${deviceId}`, leads);
}

export async function loadScheduledNotificationIds(): Promise<string[]> {
    return (await getJSON<string[]>(NOTIFICATION_IDS_KEY)) ?? [];
}

export async function saveScheduledNotificationIds(
    ids: string[],
): Promise<void> {
    await setJSON(NOTIFICATION_IDS_KEY, ids);
}
