/**
 * Shared constants for the EasyStreet app.
 */

/** Map color hex values */
export const MAP_COLORS = {
    red: "#EF4444",
    orange: "#F97316",
    yellow: "#EAB308",
    green: "#22C55E",
    gray: "#9CA3AF",
} as const;

export type CityCode = "sf" | (string & {});

export interface CityConfig {
    code: CityCode;
    name: string;
    center: {
        latitude: number;
        longitude: number;
    };
    bounds: {
        latMin: number;
        latMax: number;
        lngMin: number;
        lngMax: number;
    };
    colors: typeof MAP_COLORS;
}

/** Current rollout is San Francisco only; structure supports future cities. */
export const CITY_CONFIGS = {
    sf: {
        code: "sf",
        name: "San Francisco",
        center: {
            latitude: 37.7749,
            longitude: -122.4194,
        },
        bounds: {
            latMin: 37.7034,
            latMax: 37.8332,
            lngMin: -122.527,
            lngMax: -122.3569,
        },
        colors: MAP_COLORS,
    },
} as const satisfies Record<string, CityConfig>;

export const DEFAULT_CITY_CODE: CityCode = "sf";

/** San Francisco center coordinates (backward compatible export). */
export const SF_CENTER = CITY_CONFIGS.sf.center;

/** Default map zoom level */
export const DEFAULT_ZOOM = 14;

/** Legal disclaimer text */
export const DISCLAIMER_TEXT =
    "EasyStreet provides street sweeping schedule information for reference only. " +
    "This data is sourced from public City of San Francisco records and may not be " +
    "completely accurate or up-to-date. Always check posted street signs for current " +
    "parking regulations. EasyStreet is not responsible for any parking tickets or " +
    "towing that may occur. Use at your own risk.";

/** Default lead schedule requested for iOS production flow. */
export const DEFAULT_NOTIFICATION_LEAD_MINUTES_SET = [
    48 * 60,
    24 * 60,
    4 * 60,
    2 * 60,
] as const;

/** Custom menu options for users who do not want the default schedule. */
export const CUSTOM_NOTIFICATION_LEAD_OPTIONS = [
    { label: "72 hours", value: 72 * 60 },
    { label: "48 hours", value: 48 * 60 },
    { label: "24 hours", value: 24 * 60 },
    { label: "12 hours", value: 12 * 60 },
    { label: "8 hours", value: 8 * 60 },
    { label: "4 hours", value: 4 * 60 },
    { label: "2 hours", value: 2 * 60 },
    { label: "1 hour", value: 60 },
    { label: "30 minutes", value: 30 },
] as const;

/** Legacy single-value support; now maps to the shortest default lead. */
export const DEFAULT_NOTIFICATION_LEAD_MINUTES =
    DEFAULT_NOTIFICATION_LEAD_MINUTES_SET[
        DEFAULT_NOTIFICATION_LEAD_MINUTES_SET.length - 1
    ];

/** Backward-compatible export name used by some UIs. */
export const NOTIFICATION_LEAD_OPTIONS = CUSTOM_NOTIFICATION_LEAD_OPTIONS;

export function getCityConfig(code: string | undefined): CityConfig {
    const fallbackCity = CITY_CONFIGS.sf;
    if (!code) return fallbackCity;

    const cityConfigsByCode: Record<string, CityConfig> = CITY_CONFIGS;
    return cityConfigsByCode[code] ?? fallbackCity;
}

export function getMapColorsForCity(code: string | undefined): typeof MAP_COLORS {
    return getCityConfig(code).colors;
}

/**
 * Server sync of the parked car and preferences (Convex). Off: EasyStreet keeps
 * parking state on the device, as the privacy policy says. Turning it on is a
 * product and privacy decision (the policy must change first).
 */
export const PARKING_SERVER_SYNC = false;
