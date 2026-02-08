import * as FileSystem from "expo-file-system";

export interface OfflineTilePackConfig {
    cityCode: string;
    pathTemplate: string;
    tileSize: number;
    minimumZ: number;
    maximumZ: number;
}

interface OfflineTileManifest {
    version: 1;
    packs: OfflineTilePackConfig[];
}

const ROOT_CACHE_DIR =
    FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
const OFFLINE_TILE_MANIFEST_PATH = `${ROOT_CACHE_DIR}easystreet-cache/offline-tiles-manifest.json`;
const DEFAULT_SF_TILE_ROOT = `${ROOT_CACHE_DIR}easystreet-cache/sf-tiles`;
const DEFAULT_SF_TILE_TEMPLATE = `${DEFAULT_SF_TILE_ROOT}/{z}/{x}/{y}.png`;

async function loadManifest(): Promise<OfflineTileManifest | null> {
    if (!ROOT_CACHE_DIR) return null;

    try {
        const info = await FileSystem.getInfoAsync(OFFLINE_TILE_MANIFEST_PATH);
        if (!info.exists) return null;
        const raw = await FileSystem.readAsStringAsync(OFFLINE_TILE_MANIFEST_PATH);
        const parsed = JSON.parse(raw) as OfflineTileManifest;
        if (!parsed || !Array.isArray(parsed.packs)) return null;
        return parsed;
    } catch {
        return null;
    }
}

async function hasTileDirectory(pathTemplate: string): Promise<boolean> {
    const rootPath = pathTemplate.replace("/{z}/{x}/{y}.png", "");
    try {
        const info = await FileSystem.getInfoAsync(rootPath);
        return info.exists && info.isDirectory;
    } catch {
        return false;
    }
}

export async function loadOfflineTilePackConfig(
    cityCode: string,
): Promise<OfflineTilePackConfig | null> {
    if (!ROOT_CACHE_DIR) return null;

    const manifest = await loadManifest();
    if (manifest) {
        const fromManifest =
            manifest.packs.find((pack) => pack.cityCode === cityCode) ?? null;
        if (fromManifest && (await hasTileDirectory(fromManifest.pathTemplate))) {
            return fromManifest;
        }
    }

    if (cityCode !== "sf") return null;

    if (await hasTileDirectory(DEFAULT_SF_TILE_TEMPLATE)) {
        return {
            cityCode: "sf",
            pathTemplate: DEFAULT_SF_TILE_TEMPLATE,
            tileSize: 256,
            minimumZ: 11,
            maximumZ: 18,
        };
    }

    return null;
}

export function getOfflineTilePackInstructionsPath(): string {
    return OFFLINE_TILE_MANIFEST_PATH;
}
