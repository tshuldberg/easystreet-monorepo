import { View, Text } from "react-native";
import { getMapColorsForCity } from "@repo/shared";

export function Legend({ cityCode }: { cityCode?: string }) {
    const colors = getMapColorsForCity(cityCode);
    const items = [
        { color: colors.red, label: "Today" },
        { color: colors.orange, label: "Tomorrow" },
        { color: colors.yellow, label: "2-3 days" },
        { color: colors.green, label: "Clear" },
    ];

    return (
        <View className="absolute right-4 top-24 rounded-2xl border border-white/80 bg-white/92 p-3 shadow-lg">
            {items.map((item) => (
                <View
                    key={item.label}
                    className="mb-1.5 flex-row items-center gap-2"
                >
                    <View
                        className="h-2.5 w-5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-xs font-medium text-gray-700">
                        {item.label}
                    </Text>
                </View>
            ))}
        </View>
    );
}
