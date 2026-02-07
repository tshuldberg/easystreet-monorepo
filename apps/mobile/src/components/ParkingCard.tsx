import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStatus, formatCountdown } from "@repo/shared";
import type { SweepingRule } from "@repo/shared";

interface ParkingCardProps {
    streetName: string | null;
    rules: SweepingRule[];
    parkedAt: number | null;
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
        <SafeAreaView
            edges={["bottom"]}
            className="absolute inset-x-0 bottom-0 px-4 pb-2"
        >
            <View className="rounded-xl bg-white p-4 shadow-lg">
                <View className="mb-2 flex-row items-center justify-between">
                    <View>
                        <Text className="text-base font-semibold text-gray-900">
                            {streetName ?? "Parked"}
                        </Text>
                        {parkedTimeStr && (
                            <Text className="text-xs text-gray-500">
                                Since {parkedTimeStr}
                            </Text>
                        )}
                    </View>
                    <Pressable
                        onPress={onClear}
                        className="rounded-lg bg-red-50 px-3 py-1.5 active:bg-red-100"
                    >
                        <Text className="text-xs font-medium text-red-600">
                            Clear
                        </Text>
                    </Pressable>
                </View>
                {countdown ? (
                    <Text className="text-xl font-bold text-gray-800">
                        {countdown}
                    </Text>
                ) : null}
            </View>
        </SafeAreaView>
    );
}
