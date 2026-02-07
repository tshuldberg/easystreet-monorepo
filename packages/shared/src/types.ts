/**
 * Core data types for EasyStreet street sweeping app.
 * Ported from Swift: StreetSweepingData.swift, ParkedCar.swift, SweepingRuleEngine.swift
 */

/** Street sweeping rule for a specific street segment */
export interface SweepingRule {
    /** 1 = Sunday, 2 = Monday, ..., 7 = Saturday (matches JS Date.getDay()+1) */
    dayOfWeek: number;
    /** 24-hour format "HH:MM" */
    startTime: string;
    /** 24-hour format "HH:MM" */
    endTime: string;
    /** e.g., [1, 3] for 1st and 3rd weeks, or [] for every week */
    weeksOfMonth: number[];
    /** true if sweeping occurs even on holidays */
    applyOnHolidays: boolean;
}

/** Geographic coordinate */
export interface Coordinate {
    latitude: number;
    longitude: number;
}

/** Bounding box for efficient spatial queries */
export interface Bounds {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
}

/** A street segment with sweeping rules */
export interface StreetSegment {
    id: string;
    /** Original CNN identifier from SF data */
    cnn?: string;
    streetName: string;
    /** Block side (e.g., "North", "SouthEast") */
    blockSide?: string;
    /** Street limits (e.g., "Larkin St - Polk St") */
    limits?: string;
    coordinates: Coordinate[];
    rules: SweepingRule[];
    bounds?: Bounds;
}

/** User's parked car */
export interface ParkedCar {
    deviceId: string;
    latitude: number;
    longitude: number;
    streetName?: string;
    parkedAt: number; // Unix timestamp ms
    notificationLeadMinutes: number;
    segmentId?: string;
}

/** User preferences */
export interface UserPreferences {
    deviceId: string;
    hasSeenDisclaimer: boolean;
    notificationLeadMinutes: number;
}

/** Sweeping status — discriminated union matching Swift enum */
export type SweepingStatus =
    | { type: "safe" }
    | { type: "today"; time: Date; streetName: string }
    | { type: "activeNow"; streetName: string; endTime: Date }
    | { type: "imminent"; time: Date; streetName: string }
    | { type: "upcoming"; time: Date; streetName: string }
    | { type: "noData" }
    | { type: "unknown" };

/** Color status for map display */
export type MapColorStatus = "red" | "orange" | "yellow" | "green" | "gray";

/** Day name lookup (1-indexed: 1=Sunday) */
const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

/** Get user-friendly day name from dayOfWeek (1=Sunday, 7=Saturday) */
export function getDayName(dayOfWeek: number): string {
    if (dayOfWeek < 1 || dayOfWeek > 7) return "Unknown";
    return DAY_NAMES[dayOfWeek - 1]!;
}

/** Format time range from 24h "HH:MM" to 12h "h:mm AM - h:mm PM" */
export function formatTimeRange(startTime: string, endTime: string): string {
    const format12h = (time: string): string => {
        const [hoursStr, minutesStr] = time.split(":");
        const hours = parseInt(hoursStr ?? "0", 10);
        const minutes = minutesStr ?? "00";
        const period = hours >= 12 ? "PM" : "AM";
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHour}:${minutes} ${period}`;
    };
    return `${format12h(startTime)} - ${format12h(endTime)}`;
}

/** Get text description of which weeks a rule applies to */
export function getWeeksDescription(weeksOfMonth: number[]): string {
    if (weeksOfMonth.length === 0) return "Every week";
    const ordinals = ["1st", "2nd", "3rd", "4th", "5th"];
    const weekNames = weeksOfMonth
        .filter((w) => w >= 1 && w <= ordinals.length)
        .map((w) => ordinals[w - 1]);
    return weekNames.join(" & ") + " weeks of the month";
}
