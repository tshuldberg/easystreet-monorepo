// SDK 54 moved this function-style API to expo-file-system/legacy.
import * as FileSystem from "expo-file-system/legacy";
import type { SweepingRule } from "@repo/shared";

export interface CachedSegment {
    _id?: string;
    segmentId: string;
    streetName: string;
    limits?: string;
    coordinates: { latitude: number; longitude: number }[];
    rules: SweepingRule[];
}

interface SegmentCacheDocument {
    version: 1;
    cityCode: string;
    updatedAt: number;
    segments: CachedSegment[];
}

const ROOT_CACHE_DIR =
    FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
const CACHE_DIR = `${ROOT_CACHE_DIR}easystreet-cache`;

function cachePathForCity(cityCode: string): string {
    return `${CACHE_DIR}/${cityCode}-segments-v1.json`;
}

async function ensureCacheDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, {
            intermediates: true,
        });
    }
}

export async function loadSegmentCache(
    cityCode: string,
): Promise<CachedSegment[]> {
    if (!ROOT_CACHE_DIR) return [];
    try {
        const path = cachePathForCity(cityCode);
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return [];
        const raw = await FileSystem.readAsStringAsync(path);
        const parsed = JSON.parse(raw) as SegmentCacheDocument;
        if (!parsed || !Array.isArray(parsed.segments)) {
            return [];
        }
        return parsed.segments;
    } catch {
        return [];
    }
}

export async function saveSegmentCache(
    cityCode: string,
    segments: CachedSegment[],
): Promise<void> {
    if (!ROOT_CACHE_DIR) return;
    await ensureCacheDir();
    const path = cachePathForCity(cityCode);
    const payload: SegmentCacheDocument = {
        version: 1,
        cityCode,
        updatedAt: Date.now(),
        segments,
    };
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload));
}
