import "../global.css";
import { Stack } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

export default function RootLayout() {
    const client = useMemo(
        () =>
            new ConvexReactClient(
                process.env.EXPO_PUBLIC_CONVEX_URL as string,
                { unsavedChangesWarning: false },
            ),
        [],
    );

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
