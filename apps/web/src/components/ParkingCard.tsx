"use client";

import { useEffect, useState } from "react";
import { getStatus, formatCountdown } from "@repo/shared";
import type { SweepingRule } from "@repo/shared";

interface ParkingCardProps {
    streetName: string | null;
    rules: SweepingRule[];
    parkedAt: number | null; // Unix timestamp ms
    onClear: () => void;
}

export function ParkingCard({
    streetName,
    rules,
    parkedAt,
    onClear,
}: ParkingCardProps) {
    const [countdown, setCountdown] = useState("");

    useEffect(() => {
        if (rules.length === 0) return;

        const update = () => {
            const status = getStatus(rules, streetName ?? "Unknown");
            if (
                status.type === "today" ||
                status.type === "imminent" ||
                status.type === "upcoming"
            ) {
                const seconds =
                    (status.time.getTime() - Date.now()) / 1000;
                setCountdown(formatCountdown(seconds));
            } else if (status.type === "activeNow") {
                setCountdown("Sweeping in progress!");
            } else {
                setCountdown("Safe to park");
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [rules, streetName]);

    const parkedTimeStr = parkedAt
        ? new Date(parkedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
          })
        : null;

    return (
        <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-xl bg-white p-4 shadow-xl md:left-4 md:right-auto md:w-80">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-blue-600 p-1.5 text-white">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            {streetName ?? "Parked"}
                        </p>
                        {parkedTimeStr && (
                            <p className="text-xs text-gray-500">
                                Since {parkedTimeStr}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                    Clear
                </button>
            </div>

            {countdown && (
                <p className="text-lg font-bold text-gray-800">{countdown}</p>
            )}
        </div>
    );
}
