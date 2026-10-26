/**
 * Parses the DataSF "Street Sweeping Schedule" CSV into one segment per block side.
 * Mirrors tools/sweeping_pipeline.py in the native EasyStreet repo so every
 * platform reads the same data the same way:
 *
 * - A block side is CNN + CNNRightLeft. The CSV has one row per schedule, so a
 *   block swept on several days has several rows with the same geometry; they
 *   are merged into one segment with several rules.
 * - WeekDay = "Holiday" rows become holiday rules (kind "holiday").
 * - Week1..Week5 are the nth occurrence of the weekday; all five = every week.
 */
import type { SweepingRule } from "./types";

export interface ParsedSegment {
    segmentId: string;
    cnn: string;
    side: string;
    streetName: string;
    blockSide: string;
    limits: string;
    coordinates: { latitude: number; longitude: number }[];
    bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number };
    rules: Required<SweepingRule>[];
}

export interface ParseStats {
    rows: number;
    segments: number;
    rules: number;
    holidayRules: number;
    duplicateRules: number;
    unknownWeekday: number;
    segmentsWithoutGeometry: number;
}

const WEEKDAY_MAP: Record<string, number> = {
    sun: 1, sunday: 1,
    mon: 2, monday: 2,
    tue: 3, tues: 3, tuesday: 3,
    wed: 4, wednesday: 4,
    thu: 5, thur: 5, thurs: 5, thursday: 5,
    fri: 6, friday: 6,
    sat: 7, saturday: 7,
};

/** Splits CSV text into rows of fields, honoring quoted fields and "" escapes. */
export function splitCSV(text: string): string[][] {
    const rows: string[][] = [];
    let field = "";
    let row: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ",") {
            row.push(field);
            field = "";
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n") i++;
            row.push(field);
            if (row.some((f) => f.length > 0)) rows.push(row);
            row = [];
            field = "";
        } else {
            field += ch;
        }
    }
    row.push(field);
    if (row.some((f) => f.length > 0)) rows.push(row);
    return rows;
}

export function parseLineString(wkt: string): { latitude: number; longitude: number }[] {
    const match = wkt.match(/LINESTRING\s*\((.+)\)/);
    if (!match?.[1]) return [];
    const coords: { latitude: number; longitude: number }[] = [];
    for (const pair of match[1].split(",")) {
        const parts = pair.trim().split(/\s+/);
        if (parts.length !== 2) continue;
        const lng = Number(parts[0]);
        const lat = Number(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            coords.push({ latitude: round6(lat), longitude: round6(lng) });
        }
    }
    return coords;
}

function round6(value: number): number {
    return Math.round(value * 1e6) / 1e6;
}

/** "7.5" -> "07:30"; hours are 0-24 in the source. */
export function hourToTime(value: string): string {
    const hours = Number(value);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
        throw new Error(`hour out of range: ${value}`);
    }
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) {
        h += 1;
        m = 0;
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function normalizeSpace(text: string | undefined): string {
    return (text ?? "").trim().replace(/\s+/g, " ");
}

function ruleFromRow(row: Record<string, string>): Required<SweepingRule> | null {
    const weekday = (row["WeekDay"] ?? "").trim().toLowerCase();
    const weeks = [1, 2, 3, 4, 5].filter((i) => (row[`Week${i}`] ?? "0").trim() === "1");
    const startTime = hourToTime(row["FromHour"] ?? "");
    const endTime = hourToTime(row["ToHour"] ?? "");
    if (weekday === "holiday") {
        return { kind: "holiday", dayOfWeek: 0, startTime, endTime, weeksOfMonth: [], applyOnHolidays: true };
    }
    const dayOfWeek = WEEKDAY_MAP[weekday];
    if (dayOfWeek === undefined) return null;
    return {
        kind: "weekly",
        dayOfWeek,
        startTime,
        endTime,
        weeksOfMonth: weeks.length === 5 ? [] : weeks,
        applyOnHolidays: (row["Holidays"] ?? "0").trim() === "1",
    };
}

function ruleKey(rule: Required<SweepingRule>): string {
    return [rule.kind, rule.dayOfWeek, rule.startTime, rule.endTime, rule.weeksOfMonth.join("|"), rule.applyOnHolidays].join(";");
}

/** Parses the CSV text into segments sorted by segmentId. */
export function parseScheduleCSV(csvText: string): { segments: ParsedSegment[]; stats: ParseStats } {
    const table = splitCSV(csvText.replace(/^﻿/, ""));
    const header = (table[0] ?? []).map((h) => h.trim());
    const stats: ParseStats = {
        rows: 0, segments: 0, rules: 0, holidayRules: 0, duplicateRules: 0, unknownWeekday: 0, segmentsWithoutGeometry: 0,
    };
    const bySide = new Map<string, ParsedSegment & { keys: Set<string> }>();

    for (const values of table.slice(1)) {
        stats.rows++;
        const row: Record<string, string> = {};
        header.forEach((col, i) => {
            row[col] = values[i] ?? "";
        });
        const cnn = (row["CNN"] ?? "").trim();
        const side = (row["CNNRightLeft"] ?? "").trim();
        const segmentId = `${cnn}-${side}`;
        const coordinates = parseLineString(row["Line"] ?? "");
        let seg = bySide.get(segmentId);
        if (!seg) {
            seg = {
                segmentId,
                cnn,
                side,
                streetName: normalizeSpace(row["Corridor"]),
                blockSide: normalizeSpace(row["BlockSide"]),
                limits: normalizeSpace(row["Limits"]),
                coordinates,
                bounds: { latMin: 0, latMax: 0, lngMin: 0, lngMax: 0 },
                rules: [],
                keys: new Set(),
            };
            bySide.set(segmentId, seg);
        } else if (seg.coordinates.length === 0 && coordinates.length > 0) {
            seg.coordinates = coordinates;
        }
        if (!seg.blockSide) seg.blockSide = normalizeSpace(row["BlockSide"]);

        const rule = ruleFromRow(row);
        if (!rule) {
            stats.unknownWeekday++;
            continue;
        }
        const key = ruleKey(rule);
        if (seg.keys.has(key)) {
            stats.duplicateRules++;
            continue;
        }
        seg.keys.add(key);
        seg.rules.push(rule);
    }

    const segments: ParsedSegment[] = [];
    for (const id of [...bySide.keys()].sort()) {
        const { keys, ...seg } = bySide.get(id)!;
        void keys; // Dedupe bookkeeping is not part of the exported segment.
        if (seg.coordinates.length === 0) {
            stats.segmentsWithoutGeometry++;
            continue;
        }
        const lats = seg.coordinates.map((c) => c.latitude);
        const lngs = seg.coordinates.map((c) => c.longitude);
        seg.bounds = {
            latMin: Math.min(...lats),
            latMax: Math.max(...lats),
            lngMin: Math.min(...lngs),
            lngMax: Math.max(...lngs),
        };
        seg.rules.sort(
            (a, b) =>
                Number(a.kind !== "weekly") - Number(b.kind !== "weekly") ||
                a.dayOfWeek - b.dayOfWeek ||
                a.startTime.localeCompare(b.startTime),
        );
        segments.push(seg);
    }
    stats.segments = segments.length;
    stats.rules = segments.reduce((n, s) => n + s.rules.length, 0);
    stats.holidayRules = segments.reduce((n, s) => n + s.rules.filter((r) => r.kind === "holiday").length, 0);
    return { segments, stats };
}
