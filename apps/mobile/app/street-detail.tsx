import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";
import { StreetDetail } from "@/components/StreetDetail";

export default function StreetDetailScreen() {
    const { segmentId } = useLocalSearchParams<{ segmentId: string }>();
    const router = useRouter();

    const segment = useQuery(
        api.streets.getSegmentById,
        segmentId ? { segmentId } : "skip",
    );

    if (!segment) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-white">
                <Text className="text-gray-500">Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F2F2F7]">
            <View className="flex-row items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3">
                <Pressable
                    onPress={() => router.back()}
                    className="rounded-full bg-gray-100 px-3 py-1 active:bg-gray-200"
                >
                    <Text className="text-sm font-semibold text-blue-600">
                        Back
                    </Text>
                </Pressable>
                <Text className="text-lg font-bold text-gray-900">
                    Street Detail
                </Text>
                <View className="w-12" />
            </View>
            <ScrollView className="flex-1 px-4 pt-4">
                <StreetDetail
                    streetName={segment.streetName}
                    limits={segment.limits}
                    rules={segment.rules}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
