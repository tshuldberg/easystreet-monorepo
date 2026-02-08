import { Modal, Pressable, Text, View } from "react-native";
import {
    CUSTOM_NOTIFICATION_LEAD_OPTIONS,
    DEFAULT_NOTIFICATION_LEAD_MINUTES_SET,
} from "@repo/shared";

interface NotificationSettingsModalProps {
    visible: boolean;
    currentLeadMinutesSet: number[];
    onClose: () => void;
    onSaveDefault: () => void;
    onToggleCustomLead: (minutes: number) => void;
    onOpenSystemSettings: () => void;
}

function isSelected(set: number[], value: number): boolean {
    return set.includes(value);
}

export function NotificationSettingsModal({
    visible,
    currentLeadMinutesSet,
    onClose,
    onSaveDefault,
    onToggleCustomLead,
    onOpenSystemSettings,
}: NotificationSettingsModalProps) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View className="flex-1 items-center justify-center bg-black/40 px-5">
                <View className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-5 shadow-xl">
                    <Text className="mb-1 text-xl font-semibold text-gray-900">
                        Notification Schedule
                    </Text>
                    <Text className="mb-4 text-sm text-gray-600">
                        Default reminders are 48h, 24h, 4h, and 2h before
                        sweeping. You can keep defaults or set your own mix.
                    </Text>

                    <Pressable
                        onPress={onSaveDefault}
                        className="mb-3 rounded-2xl bg-blue-600 px-4 py-3 active:bg-blue-700"
                    >
                        <Text className="text-center font-semibold text-white">
                            Use Default (48h / 24h / 4h / 2h)
                        </Text>
                    </Pressable>

                    <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Custom Alerts
                    </Text>
                    <View className="mb-4 flex-row flex-wrap gap-2">
                        {CUSTOM_NOTIFICATION_LEAD_OPTIONS.map((option) => (
                            <Pressable
                                key={option.value}
                                onPress={() => onToggleCustomLead(option.value)}
                                className={`rounded-full border px-3 py-2 ${
                                    isSelected(
                                        currentLeadMinutesSet,
                                        option.value,
                                    )
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-gray-200 bg-gray-50"
                                }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        isSelected(
                                            currentLeadMinutesSet,
                                            option.value,
                                        )
                                            ? "text-blue-700"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text className="mb-4 text-xs text-gray-500">
                        At least one alert must stay selected.
                    </Text>

                    <Pressable
                        onPress={onOpenSystemSettings}
                        className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 active:bg-gray-100"
                    >
                        <Text className="text-center font-semibold text-gray-700">
                            Open iOS Notification Settings
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
                    >
                        <Text className="text-center font-semibold text-gray-800">
                            Done
                        </Text>
                    </Pressable>

                    <Text className="mt-3 text-[11px] text-gray-400">
                        Current:{" "}
                        {currentLeadMinutesSet
                            .slice()
                            .sort((a, b) => b - a)
                            .map((minutes) => {
                                const days = minutes / 1440;
                                if (days >= 1 && Number.isInteger(days)) {
                                    return `${days}d`;
                                }
                                if (minutes >= 60) {
                                    return `${minutes / 60}h`;
                                }
                                return `${minutes}m`;
                            })
                            .join(" / ") ||
                            DEFAULT_NOTIFICATION_LEAD_MINUTES_SET.map(
                                (minutes) => `${minutes / 60}h`,
                            ).join(" / ")}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
