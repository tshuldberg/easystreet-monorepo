/**
 * Shared constants for the EasyStreet app.
 */

/** San Francisco center coordinates */
export const SF_CENTER = {
    latitude: 37.7749,
    longitude: -122.4194,
} as const;

/** Default map zoom level */
export const DEFAULT_ZOOM = 14;

/** Legal disclaimer text */
export const DISCLAIMER_TEXT =
    "EasyStreet provides street sweeping schedule information for reference only. " +
    "This data is sourced from public City of San Francisco records and may not be " +
    "completely accurate or up-to-date. Always check posted street signs for current " +
    "parking regulations. EasyStreet is not responsible for any parking tickets or " +
    "towing that may occur. Use at your own risk.";

/** Notification lead time options (minutes) */
export const NOTIFICATION_LEAD_OPTIONS = [
    { label: "15 minutes", value: 15 },
    { label: "30 minutes", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
    { label: "4 hours", value: 240 },
] as const;

/** Default notification lead time in minutes */
export const DEFAULT_NOTIFICATION_LEAD_MINUTES = 60;

/** Map color hex values */
export const MAP_COLORS = {
    red: "#EF4444",
    orange: "#F97316",
    yellow: "#EAB308",
    green: "#22C55E",
    gray: "#9CA3AF",
} as const;
