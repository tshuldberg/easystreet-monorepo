import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";
import { DEFAULT_NOTIFICATION_LEAD_MINUTES } from "@repo/shared";
import { MapDisplay } from "@/components/MapDisplay";
import { ParkingCard } from "@/components/ParkingCard";
import { SearchBar } from "@/components/SearchBar";
import { Legend } from "@/components/Legend";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useLocation } from "@/hooks/useLocation";
import { useState, useCallback } from "react";

export default function HomeScreen() {
    const deviceId = useDeviceId();
    const location = useLocation();
    const router = useRouter();

    const [bounds, setBounds] = useState({
        latMin: 37.74,
        latMax: 37.81,
        lngMin: -122.46,
        lngMax: -122.38,
    });

    const segments = useQuery(api.streets.getSegmentsInBounds, bounds);
    const parkedCar = useQuery(
        api.parking.getParkedCar,
        deviceId ? { deviceId } : "skip",
    );
    const preferences = useQuery(
        api.preferences.getPreferences,
        deviceId ? { deviceId } : "skip",
    );

    const parkCar = useMutation(api.parking.parkCar);
    const updateLocation = useMutation(api.parking.updateParkedLocation);
    const clearCar = useMutation(api.parking.clearParkedCar);
    const setPrefs = useMutation(api.preferences.setPreferences);

    const needsDisclaimer =
        deviceId &&
        preferences !== undefined &&
        !preferences?.hasSeenDisclaimer;

    const handleParkHere = useCallback(async () => {
        if (!deviceId || !location) return;
        await parkCar({
            deviceId,
            latitude: location.latitude,
            longitude: location.longitude,
            notificationLeadMinutes: DEFAULT_NOTIFICATION_LEAD_MINUTES,
        });
    }, [deviceId, location, parkCar]);

    const handleClearParking = useCallback(async () => {
        if (!deviceId) return;
        await clearCar({ deviceId });
    }, [deviceId, clearCar]);

    const handleAcceptDisclaimer = useCallback(async () => {
        if (!deviceId) return;
        await setPrefs({ deviceId, hasSeenDisclaimer: true });
    }, [deviceId, setPrefs]);

    const handleSegmentPress = useCallback(
        (segmentId: string) => {
            router.push({
                pathname: "/street-detail",
                params: { segmentId },
            });
        },
        [router],
    );

    return (
        <View className="flex-1 bg-gray-50">
            <MapDisplay
                segments={segments ?? []}
                parkedLocation={
                    parkedCar
                        ? {
                              latitude: parkedCar.latitude,
                              longitude: parkedCar.longitude,
                          }
                        : null
                }
                userLocation={location}
                onRegionChange={(region) =>
                    setBounds({
                        latMin: region.latitude - region.latitudeDelta / 2,
                        latMax: region.latitude + region.latitudeDelta / 2,
                        lngMin:
                            region.longitude - region.longitudeDelta / 2,
                        lngMax:
                            region.longitude + region.longitudeDelta / 2,
                    })
                }
                onSegmentPress={handleSegmentPress}
            />

            <SafeAreaView
                edges={["top"]}
                className="pointer-events-none absolute inset-x-0 top-0"
            >
                <View className="pointer-events-auto px-4 pt-2">
                    <SearchBar onSelect={handleSegmentPress} />
                </View>
            </SafeAreaView>

            <Legend />

            {/* Park Here button */}
            {!parkedCar && (
                <SafeAreaView
                    edges={["bottom"]}
                    className="absolute inset-x-0 bottom-0 items-center pb-4"
                >
                    <Pressable
                        onPress={handleParkHere}
                        className="rounded-full bg-blue-600 px-8 py-4 shadow-xl active:bg-blue-700"
                    >
                        <Text className="text-lg font-bold text-white">
                            I Parked Here
                        </Text>
                    </Pressable>
                </SafeAreaView>
            )}

            {/* Parking card */}
            {parkedCar && (
                <ParkingCard
                    streetName={parkedCar.streetName ?? null}
                    rules={
                        segments?.find(
                            (s: { segmentId: string }) => s.segmentId === parkedCar.segmentId,
                        )?.rules ?? []
                    }
                    parkedAt={parkedCar.parkedAt}
                    onClear={handleClearParking}
                />
            )}

            {/* Disclaimer modal */}
            {needsDisclaimer && (
                <DisclaimerModal onAccept={handleAcceptDisclaimer} />
            )}
        </View>
    );
}
