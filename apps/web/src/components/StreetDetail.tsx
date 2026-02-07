"use client";

import { useEffect, useState } from "react";
import {
    getDayName,
    formatTimeRange,
    getWeeksDescription,
    getStatus,
    formatCountdown,
} from "@repo/shared";
import type { SweepingRule } from "@repo/shared";

interface StreetDetailProps {
    streetName: string;
    rules: SweepingRule[];
    onClose: () => void;
}

export function StreetDetail({ streetName, rules, onClose }: StreetDetailProps) {
    const [countdown, setCountdown] = useState("");

    useEffect(() => {
        const update = () => {
            const status = getStatus(rules, streetName);
            if (status.type === "today" || status.type === "imminent") {
                const seconds =
                    (status.time.getTime() - Date.now()) / 1000;
                setCountdown(formatCountdown(seconds));
            } else if (status.type === "upcoming") {
                const seconds =
                    (status.time.getTime() - Date.now()) / 1000;
                setCountdown(formatCountdown(seconds));
            } else if (status.type === "activeNow") {
                const seconds =
                    (status.endTime.getTime() - Date.now()) / 1000;
                setCountdown("Sweeping in progress");
                if (seconds <= 0) setCountdown("Sweep completed");
            } else {
                setCountdown("");
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [rules, streetName]);

    const status = getStatus(rules, streetName);

    return (
        <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-xl bg-white p-5 shadow-xl md:left-auto md:right-4 md:w-96">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                    {streetName}
                </h2>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Status badge */}
            <div className="mb-3">
                {status.type === "activeNow" && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        Sweeping Now
                    </span>
                )}
                {status.type === "imminent" && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                        Imminent
                    </span>
                )}
                {status.type === "today" && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                        Today
                    </span>
                )}
                {status.type === "safe" && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Safe to Park
                    </span>
                )}
                {status.type === "upcoming" && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        Upcoming
                    </span>
                )}
            </div>

            {countdown && (
                <p className="mb-3 text-2xl font-bold text-gray-800">
                    {countdown}
                </p>
            )}

            {/* Weekly schedule */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Schedule
                </h3>
                {rules.length === 0 ? (
                    <p className="text-sm text-gray-500">No sweeping data</p>
                ) : (
                    rules.map((rule, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                        >
                            <div>
                                <p className="font-medium text-gray-800">
                                    {getDayName(rule.dayOfWeek)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {getWeeksDescription(rule.weeksOfMonth)}
                                </p>
                            </div>
                            <p className="text-sm text-gray-600">
                                {formatTimeRange(
                                    rule.startTime,
                                    rule.endTime,
                                )}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
