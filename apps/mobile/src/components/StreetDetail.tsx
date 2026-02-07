import { useEffect, useState } from "react";
import { View, Text } from "react-native";
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
    limits?: string;
    rules: SweepingRule[];
}

export function StreetDetail({ streetName, limits, rules }: StreetDetailProps) {
    const [countdown, setCountdown] = useState("");

    useEffect(() => {
        const update = () => {
            const status = getStatus(rules, streetName);
            if (
                status.type === "today" ||
                status.type === "imminent" ||
                status.type === "upcoming"
            ) {
                const seconds =
                    (status.time.getTime() - Date.now()) / 1000;
                setCountdown(formatCountdown(seconds));
            } else if (status.type === "activeNow") {
                setCountdown("Sweeping in progress");
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
        <View>
            <Text className="mb-1 text-2xl font-bold text-gray-900">
                {streetName}
            </Text>
            {limits && (
                <Text className="mb-3 text-sm text-gray-500">{limits}</Text>
            )}

            {/* Status badge */}
            <View className="mb-3">
                {status.type === "activeNow" && (
                    <View className="self-start rounded-full bg-red-100 px-3 py-1">
                        <Text className="text-sm font-medium text-red-700">
                            Sweeping Now
                        </Text>
                    </View>
                )}
                {status.type === "imminent" && (
                    <View className="self-start rounded-full bg-orange-100 px-3 py-1">
                        <Text className="text-sm font-medium text-orange-700">
                            Imminent
                        </Text>
                    </View>
                )}
                {status.type === "today" && (
                    <View className="self-start rounded-full bg-yellow-100 px-3 py-1">
                        <Text className="text-sm font-medium text-yellow-700">
                            Today
                        </Text>
                    </View>
                )}
                {status.type === "safe" && (
                    <View className="self-start rounded-full bg-green-100 px-3 py-1">
                        <Text className="text-sm font-medium text-green-700">
                            Safe to Park
                        </Text>
                    </View>
                )}
            </View>

            {countdown ? (
                <Text className="mb-4 text-3xl font-bold text-gray-800">
                    {countdown}
                </Text>
            ) : null}

            {/* Schedule */}
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Schedule
            </Text>
            {rules.length === 0 ? (
                <Text className="text-sm text-gray-500">No sweeping data</Text>
            ) : (
                rules.map((rule, i) => (
                    <View
                        key={i}
                        className="mb-2 flex-row items-center justify-between rounded-lg bg-gray-50 px-3 py-3"
                    >
                        <View>
                            <Text className="font-medium text-gray-800">
                                {getDayName(rule.dayOfWeek)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {getWeeksDescription(rule.weeksOfMonth)}
                            </Text>
                        </View>
                        <Text className="text-sm text-gray-600">
                            {formatTimeRange(rule.startTime, rule.endTime)}
                        </Text>
                    </View>
                ))
            )}
        </View>
    );
}
