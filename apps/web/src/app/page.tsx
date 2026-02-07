"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";
import { DEFAULT_NOTIFICATION_LEAD_MINUTES } from "@repo/shared";
import { Map } from "@/components/Map";
import { StreetDetail } from "@/components/StreetDetail";
import { ParkingCard } from "@/components/ParkingCard";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { SearchBar } from "@/components/SearchBar";
import { Legend } from "@/components/Legend";
import { useDeviceId } from "@/hooks/useDeviceId";

interface SelectedSegment {
    segmentId: string;
    streetName: string;
    rules: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        weeksOfMonth: number[];
        applyOnHolidays: boolean;
    }[];
}

export default function HomePage() {
    const deviceId = useDeviceId();
    const [bounds, setBounds] = useState({
        latMin: 37.74,
        latMax: 37.81,
        lngMin: -122.46,
        lngMax: -122.38,
    });
    const [selectedSegment, setSelectedSegment] =
        useState<SelectedSegment | null>(null);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

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

    // Show disclaimer on first visit
    const needsDisclaimer =
        deviceId && preferences !== undefined && !preferences?.hasSeenDisclaimer;

    const handleAcceptDisclaimer = useCallback(async () => {
        if (!deviceId) return;
        await setPrefs({
            deviceId,
            hasSeenDisclaimer: true,
        });
        setShowDisclaimer(false);
    }, [deviceId, setPrefs]);

    const handleParkHere = useCallback(async () => {
        if (!deviceId) return;
        // Use map center as parking location
        const lat = (bounds.latMin + bounds.latMax) / 2;
        const lng = (bounds.lngMin + bounds.lngMax) / 2;
        await parkCar({
            deviceId,
            latitude: lat,
            longitude: lng,
            notificationLeadMinutes: DEFAULT_NOTIFICATION_LEAD_MINUTES,
        });
    }, [deviceId, bounds, parkCar]);

    const handleParkingDrag = useCallback(
        async (lat: number, lng: number) => {
            if (!deviceId) return;
            await updateLocation({ deviceId, latitude: lat, longitude: lng });
        },
        [deviceId, updateLocation],
    );

    const handleClearParking = useCallback(async () => {
        if (!deviceId) return;
        await clearCar({ deviceId });
    }, [deviceId, clearCar]);

    const handleSegmentSearch = useCallback(
        (_segmentId: string) => {
            // Find segment in loaded data or trigger a fetch
            const seg = segments?.find((s: SelectedSegment) => s.segmentId === _segmentId);
            if (seg) {
                setSelectedSegment({
                    segmentId: seg.segmentId,
                    streetName: seg.streetName,
                    rules: seg.rules,
                });
            }
        },
        [segments],
    );

    return (
        <main className="relative h-screen w-screen">
            <Map
                segments={segments ?? []}
                parkedLocation={
                    parkedCar
                        ? {
                              latitude: parkedCar.latitude,
                              longitude: parkedCar.longitude,
                          }
                        : null
                }
                onBoundsChange={setBounds}
                onSegmentClick={(seg) =>
                    setSelectedSegment({
                        segmentId: seg.segmentId,
                        streetName: seg.streetName,
                        rules: seg.rules,
                    })
                }
                onParkingDrag={handleParkingDrag}
            />

            <SearchBar onSelect={handleSegmentSearch} />
            <Legend />

            {/* Park Here button */}
            {!parkedCar && (
                <button
                    onClick={handleParkHere}
                    className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-blue-600 px-6 py-3 font-bold text-white shadow-xl transition-colors hover:bg-blue-700"
                >
                    I Parked Here
                </button>
            )}

            {/* Parking card */}
            {parkedCar && (
                <ParkingCard
                    streetName={parkedCar.streetName ?? null}
                    rules={
                        segments?.find(
                            (s: SelectedSegment) => s.segmentId === parkedCar.segmentId,
                        )?.rules ?? []
                    }
                    parkedAt={parkedCar.parkedAt}
                    onClear={handleClearParking}
                />
            )}

            {/* Street detail panel */}
            {selectedSegment && (
                <StreetDetail
                    streetName={selectedSegment.streetName}
                    rules={selectedSegment.rules}
                    onClose={() => setSelectedSegment(null)}
                />
            )}

            {/* Disclaimer modal */}
            {(needsDisclaimer || showDisclaimer) && (
                <DisclaimerModal onAccept={handleAcceptDisclaimer} />
            )}
        </main>
    );
}
