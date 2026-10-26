"use client";

import { useState, useCallback, useMemo } from "react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";
import { DEFAULT_NOTIFICATION_LEAD_MINUTES, PARKING_SERVER_SYNC } from "@repo/shared";
import { Map } from "@/components/Map";
import { StreetDetail } from "@/components/StreetDetail";
import { ParkingCard } from "@/components/ParkingCard";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { SearchBar } from "@/components/SearchBar";
import { Legend } from "@/components/Legend";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useSyncMutation } from "@/hooks/useSyncMutation";

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

interface Segment extends SelectedSegment {
    _id?: string;
    limits?: string;
    coordinates: { latitude: number; longitude: number }[];
}

function toSelectedSegment(segment: SelectedSegment): SelectedSegment {
    return {
        segmentId: segment.segmentId,
        streetName: segment.streetName,
        rules: segment.rules,
    };
}

export default function HomePage() {
    const deviceId = useDeviceId();
    const convex = useConvex();
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
        PARKING_SERVER_SYNC && deviceId ? { deviceId } : "skip",
    );
    const preferences = useQuery(
        api.preferences.getPreferences,
        PARKING_SERVER_SYNC && deviceId ? { deviceId } : "skip",
    );
    const parkedSegment = useQuery(
        api.streets.getSegmentById,
        parkedCar?.segmentId ? { segmentId: parkedCar.segmentId } : "skip",
    ) as Segment | null | undefined;

    const parkCar = useSyncMutation(api.parking.parkCar);
    const updateLocation = useSyncMutation(api.parking.updateParkedLocation);
    const clearCar = useSyncMutation(api.parking.clearParkedCar);
    const setPrefs = useSyncMutation(api.preferences.setPreferences);
    const liveSegments = (segments ?? []) as Segment[];
    const segmentsById = useMemo(
        () =>
            new globalThis.Map(
                liveSegments.map((segment) => [segment.segmentId, segment] as const),
            ),
        [liveSegments],
    );

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
        let nearest: Segment | null = null;
        try {
            nearest = (await convex.query(api.streets.findNearestSegment, {
                latitude: lat,
                longitude: lng,
            })) as Segment | null;
        } catch {
            nearest = null;
        }
        await parkCar({
            deviceId,
            latitude: lat,
            longitude: lng,
            streetName: nearest?.streetName,
            segmentId: nearest?.segmentId,
            notificationLeadMinutes: DEFAULT_NOTIFICATION_LEAD_MINUTES,
        });
    }, [bounds, convex, deviceId, parkCar]);

    const handleParkingDrag = useCallback(
        async (lat: number, lng: number) => {
            if (!deviceId) return;
            let nearest: Segment | null = null;
            try {
                nearest = (await convex.query(api.streets.findNearestSegment, {
                    latitude: lat,
                    longitude: lng,
                })) as Segment | null;
            } catch {
                nearest = null;
            }
            await updateLocation({
                deviceId,
                latitude: lat,
                longitude: lng,
                streetName: nearest?.streetName,
                segmentId: nearest?.segmentId,
            });
        },
        [convex, deviceId, updateLocation],
    );

    const handleClearParking = useCallback(async () => {
        if (!deviceId) return;
        await clearCar({ deviceId });
    }, [deviceId, clearCar]);

    const handleSegmentSearch = useCallback(
        async (segmentId: string) => {
            const loaded = segmentsById.get(segmentId);
            if (loaded) {
                setSelectedSegment(toSelectedSegment(loaded));
                return;
            }

            let fetched: Segment | null = null;
            try {
                fetched = (await convex.query(api.streets.getSegmentById, {
                    segmentId,
                })) as Segment | null;
            } catch {
                fetched = null;
            }
            if (fetched) {
                setSelectedSegment(toSelectedSegment(fetched));
            }
        },
        [convex, segmentsById],
    );

    return (
        <main className="relative h-screen w-screen">
            <Map
                segments={liveSegments}
                parkedLocation={
                    parkedCar
                        ? {
                              latitude: parkedCar.latitude,
                              longitude: parkedCar.longitude,
                          }
                        : null
                }
                onBoundsChange={setBounds}
                onSegmentClick={(segment) =>
                    setSelectedSegment(toSelectedSegment(segment))
                }
                onParkingDrag={handleParkingDrag}
            />

            <SearchBar
                onSelect={(segmentId) => {
                    void handleSegmentSearch(segmentId);
                }}
            />
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
                        parkedSegment?.rules ??
                        segmentsById.get(parkedCar.segmentId ?? "")?.rules ??
                        []
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
