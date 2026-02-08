import "../global.css";
import { Stack } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import * as Notifications from "expo-notifications";
import { useMemo } from "react";
import { View, Text } from "react-native";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function RootLayout() {
    const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
    const client = useMemo(
        () =>
            convexUrl
                ? new ConvexReactClient(convexUrl, {
                      unsavedChangesWarning: false,
                  })
                : null,
        [convexUrl],
    );

    if (!client) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-center text-base text-gray-700">
                    Missing EXPO_PUBLIC_CONVEX_URL. Configure the backend URL
                    to run EasyStreet.
                </Text>
            </View>
        );
    }

    return (
        <ConvexProvider client={client}>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </ConvexProvider>
    );
}
