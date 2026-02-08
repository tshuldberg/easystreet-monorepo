import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStatus, formatCountdown } from "@repo/shared";
import type { SweepingRule } from "@repo/shared";

interface ParkingCardProps {
    streetName: string | null;
    rules: SweepingRule[];
    parkedAt: number | null;
    notificationLeadMinutesSet: number[];
    onClear: () => void;
    onOpenNotificationSettings: () => void;
}

function formatLead(minutes: number): string {
    if (minutes >= 60) {
        const hours = minutes / 60;
        if (hours >= 24) {
            const days = hours / 24;
            return days === 1 ? "1d" : `${days}d`;
        }
        return hours === 1 ? "1h" : `${hours}h`;
    }
    return `${minutes}m`;
}

export function ParkingCard({
    streetName,
    rules,
    parkedAt,
    notificationLeadMinutesSet,
    onClear,
    onOpenNotificationSettings,
}: ParkingCardProps) {
    const [countdown, setCountdown] = useState("");
    const status = getStatus(rules, streetName ?? "Unknown");

    useEffect(() => {
        if (rules.length === 0) return;

        const update = () => {
            const nextStatus = getStatus(rules, streetName ?? "Unknown");
            if (
                nextStatus.type === "today" ||
                nextStatus.type === "imminent" ||
                nextStatus.type === "upcoming"
            ) {
                const seconds = (nextStatus.time.getTime() - Date.now()) / 1000;
                setCountdown(formatCountdown(seconds));
            } else if (nextStatus.type === "activeNow") {
                setCountdown("Sweeping in progress");
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

    const statusBadge = useMemo(() => {
        switch (status.type) {
            case "activeNow":
                return { text: "Sweeping now", color: "text-red-700", bg: "bg-red-100" };
            case "imminent":
                return {
                    text: "Imminent",
                    color: "text-orange-700",
                    bg: "bg-orange-100",
                };
            case "today":
                return {
                    text: "Today",
                    color: "text-yellow-700",
                    bg: "bg-yellow-100",
                };
            case "upcoming":
                return {
                    text: "Upcoming",
                    color: "text-blue-700",
                    bg: "bg-blue-100",
                };
            case "safe":
            default:
                return { text: "Clear", color: "text-green-700", bg: "bg-green-100" };
        }
    }, [status.type]);

    const leadText = notificationLeadMinutesSet
        .slice()
        .sort((a, b) => b - a)
        .map((value) => formatLead(value))
        .join(" / ");

    return (
        <SafeAreaView
            edges={["bottom"]}
            className="absolute inset-x-0 bottom-0 px-4 pb-2"
        >
            <View className="rounded-3xl border border-white/80 bg-white/95 p-4 shadow-xl">
                <View className="mb-2 flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                        <Text className="text-base font-semibold text-gray-900">
                            {streetName ?? "Parked Location"}
                        </Text>
                        {parkedTimeStr && (
                            <Text className="text-xs text-gray-500">
                                Parked at {parkedTimeStr}
                            </Text>
                        )}
                    </View>
                    <View
                        className={`rounded-full px-2.5 py-1 ${statusBadge.bg}`}
                    >
                        <Text className={`text-xs font-semibold ${statusBadge.color}`}>
                            {statusBadge.text}
                        </Text>
                    </View>
                </View>

                {countdown ? (
                    <Text className="mb-2 text-[22px] font-bold text-gray-900">
                        {countdown}
                    </Text>
                ) : null}

                <Text className="mb-3 text-xs text-gray-500">
                    Alerts: {leadText || "48h / 24h / 4h / 2h"}
                </Text>

                <View className="flex-row gap-2">
                    <Pressable
                        onPress={onOpenNotificationSettings}
                        className="flex-1 items-center rounded-xl bg-gray-100 px-3 py-2.5 active:bg-gray-200"
                    >
                        <Text className="text-sm font-semibold text-gray-800">
                            Notifications
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={onClear}
                        className="items-center rounded-xl bg-red-50 px-4 py-2.5 active:bg-red-100"
                    >
                        <Text className="text-sm font-semibold text-red-600">
                            Clear
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
