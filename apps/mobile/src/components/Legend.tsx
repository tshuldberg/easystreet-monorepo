import { View, Text } from "react-native";
import { MAP_COLORS } from "@repo/shared";

const items = [
    { color: MAP_COLORS.red, label: "Today" },
    { color: MAP_COLORS.orange, label: "Tomorrow" },
    { color: MAP_COLORS.yellow, label: "2-3 days" },
    { color: MAP_COLORS.green, label: "Clear" },
];

export function Legend() {
    return (
        <View className="absolute right-4 top-24 rounded-xl bg-white/90 p-2.5 shadow-lg">
            {items.map((item) => (
                <View key={item.label} className="mb-1 flex-row items-center gap-1.5">
                    <View
                        className="h-2.5 w-5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-xs text-gray-600">{item.label}</Text>
                </View>
            ))}
        </View>
    );
}
