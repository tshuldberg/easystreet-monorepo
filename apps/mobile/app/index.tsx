import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";
import {
    DEFAULT_CITY_CODE,
    DEFAULT_NOTIFICATION_LEAD_MINUTES,
    DEFAULT_NOTIFICATION_LEAD_MINUTES_SET,
    getCityConfig,
    getNextSweepingTime,
    type Bounds,
    type SweepingRule,
} from "@repo/shared";
import { MapDisplay } from "@/components/MapDisplay";
import { ParkingCard } from "@/components/ParkingCard";
import { SearchBar } from "@/components/SearchBar";
import { Legend } from "@/components/Legend";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { NotificationSettingsModal } from "@/components/NotificationSettingsModal";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useLocation } from "@/hooks/useLocation";
import {
    loadLocalLeadMinutesSet,
    loadLocalParkedSnapshot,
    saveLocalLeadMinutesSet,
    saveLocalParkedSnapshot,
    type LocalParkedCarSnapshot,
} from "@/data/localStore";
import {
    loadSegmentCache,
    saveSegmentCache,
    type CachedSegment,
} from "@/data/segmentCache";
import {
    cancelScheduledParkingNotifications,
    ensureParkingNotificationPermissions,
    openSystemNotificationSettings,
    scheduleParkingNotifications,
} from "@/services/notifications";

interface Segment {
    _id?: string;
    segmentId: string;
    streetName: string;
    limits?: string;
    coordinates: { latitude: number; longitude: number }[];
    rules: SweepingRule[];
}

function normalizeLeadMinutesSet(values?: number[] | null): number[] {
    const normalized = Array.from(
        new Set((values ?? []).filter((minutes) => minutes > 0)),
    ).sort((a, b) => b - a);
    if (normalized.length === 0) {
        return [...DEFAULT_NOTIFICATION_LEAD_MINUTES_SET];
    }
    return normalized;
}

function mergeSegments(
    base: Segment[] | CachedSegment[],
    incoming: Segment[] | CachedSegment[],
): Segment[] {
    const map = new Map<string, Segment>();
    for (const segment of base) {
        map.set(segment.segmentId, segment as Segment);
    }
    for (const segment of incoming) {
        map.set(segment.segmentId, segment as Segment);
    }
    return Array.from(map.values());
}

function buildBoundsTiles(bounds: Bounds, rows = 4, cols = 4): Bounds[] {
    const latStep = (bounds.latMax - bounds.latMin) / rows;
    const lngStep = (bounds.lngMax - bounds.lngMin) / cols;
    const tiles: Bounds[] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const latMin = bounds.latMin + row * latStep;
            const latMax = bounds.latMin + (row + 1) * latStep;
            const lngMin = bounds.lngMin + col * lngStep;
            const lngMax = bounds.lngMin + (col + 1) * lngStep;
            tiles.push({ latMin, latMax, lngMin, lngMax });
        }
    }

    return tiles;
}

export default function HomeScreen() {
    const deviceId = useDeviceId();
    const location = useLocation();
    const router = useRouter();
    const convex = useConvex();

    const cityCode = DEFAULT_CITY_CODE;
    const cityConfig = getCityConfig(cityCode);
    const [bounds, setBounds] = useState<Bounds>(cityConfig.bounds);
    const [cachedSegments, setCachedSegments] = useState<Segment[]>([]);
    const [cacheHydrated, setCacheHydrated] = useState(false);
    const [localParkedCar, setLocalParkedCar] =
        useState<LocalParkedCarSnapshot | null>(null);
    const [localLeadMinutesSet, setLocalLeadMinutesSet] = useState<number[]>(
        [...DEFAULT_NOTIFICATION_LEAD_MINUTES_SET],
    );
    const [showNotificationSettings, setShowNotificationSettings] =
        useState(false);

    const hasPrimedCityCache = useRef(false);
    const initializedPreferences = useRef(false);
    const migratedLegacyLeads = useRef(false);
    const scheduledSignatureRef = useRef<string | null>(null);

    const segmentsQuery = useQuery(api.streets.getSegmentsInBounds, bounds);
    const parkedCarQuery = useQuery(
        api.parking.getParkedCar,
        deviceId ? { deviceId } : "skip",
    );
    const preferencesQuery = useQuery(
        api.preferences.getPreferences,
        deviceId ? { deviceId } : "skip",
    );

    const parkCar = useMutation(api.parking.parkCar);
    const updateLocation = useMutation(api.parking.updateParkedLocation);
    const clearCar = useMutation(api.parking.clearParkedCar);
    const setPrefs = useMutation(api.preferences.setPreferences);

    const activeParkedCar: LocalParkedCarSnapshot | null = useMemo(() => {
        if (parkedCarQuery === undefined) return localParkedCar;
        if (!parkedCarQuery) return null;
        return {
            latitude: parkedCarQuery.latitude,
            longitude: parkedCarQuery.longitude,
            streetName: parkedCarQuery.streetName ?? null,
            parkedAt: parkedCarQuery.parkedAt ?? Date.now(),
            segmentId: parkedCarQuery.segmentId ?? null,
        };
    }, [localParkedCar, parkedCarQuery]);

    const activeLeadMinutesSet = useMemo(() => {
        if (preferencesQuery === undefined) {
            return normalizeLeadMinutesSet(localLeadMinutesSet);
        }
        if (!preferencesQuery) {
            return normalizeLeadMinutesSet(localLeadMinutesSet);
        }
        if (preferencesQuery.notificationLeadMinutesSet) {
            return normalizeLeadMinutesSet(
                preferencesQuery.notificationLeadMinutesSet,
            );
        }
        if (preferencesQuery.notificationLeadMinutes) {
            return normalizeLeadMinutesSet([
                preferencesQuery.notificationLeadMinutes,
            ]);
        }
        return normalizeLeadMinutesSet(localLeadMinutesSet);
    }, [localLeadMinutesSet, preferencesQuery]);

    const liveSegments = (segmentsQuery ?? []) as Segment[];
    const allSegments = useMemo(
        () => mergeSegments(cachedSegments, liveSegments),
        [cachedSegments, liveSegments],
    );

    const localSearchCandidates = useMemo(
        () =>
            allSegments.map((segment) => ({
                segmentId: segment.segmentId,
                streetName: segment.streetName,
                limits: segment.limits,
            })),
        [allSegments],
    );

    const parkedSegmentFromCache = useMemo(() => {
        if (!activeParkedCar?.segmentId) return null;
        return (
            allSegments.find(
                (segment) => segment.segmentId === activeParkedCar.segmentId,
            ) ?? null
        );
    }, [activeParkedCar?.segmentId, allSegments]);

    const parkedSegmentFromQuery = useQuery(
        api.streets.getSegmentById,
        activeParkedCar?.segmentId
            ? { segmentId: activeParkedCar.segmentId }
            : "skip",
    ) as Segment | null | undefined;

    const parkedSegment = parkedSegmentFromQuery ?? parkedSegmentFromCache;

    const needsDisclaimer =
        deviceId &&
        preferencesQuery !== undefined &&
        !preferencesQuery?.hasSeenDisclaimer;

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const segments = await loadSegmentCache(cityCode);
            if (cancelled) return;
            setCachedSegments(segments);
            setCacheHydrated(true);
        })();

        return () => {
            cancelled = true;
        };
    }, [cityCode]);

    useEffect(() => {
        if (!deviceId) return;
        let cancelled = false;

        (async () => {
            const [parked, leads] = await Promise.all([
                loadLocalParkedSnapshot(deviceId),
                loadLocalLeadMinutesSet(deviceId),
            ]);
            if (cancelled) return;
            if (parked) {
                setLocalParkedCar(parked);
            }
            if (leads) {
                setLocalLeadMinutesSet(normalizeLeadMinutesSet(leads));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [deviceId]);

    useEffect(() => {
        if (!cacheHydrated || cachedSegments.length === 0) return;
        const timer = setTimeout(() => {
            void saveSegmentCache(cityCode, cachedSegments);
        }, 750);
        return () => clearTimeout(timer);
    }, [cacheHydrated, cachedSegments, cityCode]);

    useEffect(() => {
        if (!liveSegments || liveSegments.length === 0) return;
        setCachedSegments((previous) => mergeSegments(previous, liveSegments));
    }, [liveSegments]);

    useEffect(() => {
        if (!deviceId || parkedCarQuery === undefined) return;

        const snapshot = parkedCarQuery
            ? {
                  latitude: parkedCarQuery.latitude,
                  longitude: parkedCarQuery.longitude,
                  streetName: parkedCarQuery.streetName ?? null,
                  parkedAt: parkedCarQuery.parkedAt ?? Date.now(),
                  segmentId: parkedCarQuery.segmentId ?? null,
              }
            : null;

        setLocalParkedCar(snapshot);
        void saveLocalParkedSnapshot(deviceId, snapshot);
    }, [deviceId, parkedCarQuery]);

    useEffect(() => {
        if (!deviceId || !preferencesQuery) return;

        const normalized = normalizeLeadMinutesSet(
            preferencesQuery.notificationLeadMinutesSet ??
                (preferencesQuery.notificationLeadMinutes
                    ? [preferencesQuery.notificationLeadMinutes]
                    : undefined),
        );
        setLocalLeadMinutesSet(normalized);
        void saveLocalLeadMinutesSet(deviceId, normalized);
    }, [deviceId, preferencesQuery]);

    useEffect(() => {
        if (
            !deviceId ||
            !preferencesQuery ||
            preferencesQuery.notificationLeadMinutesSet ||
            migratedLegacyLeads.current
        ) {
            return;
        }

        migratedLegacyLeads.current = true;
        const defaultLeads = [...DEFAULT_NOTIFICATION_LEAD_MINUTES_SET];
        void setPrefs({
            deviceId,
            activeCityCode: preferencesQuery.activeCityCode ?? cityCode,
            notificationLeadMinutesSet: defaultLeads,
            notificationLeadMinutes:
                defaultLeads[defaultLeads.length - 1] ??
                DEFAULT_NOTIFICATION_LEAD_MINUTES,
        });
    }, [cityCode, deviceId, preferencesQuery, setPrefs]);

    useEffect(() => {
        if (
            !deviceId ||
            preferencesQuery !== null ||
            initializedPreferences.current
        ) {
            return;
        }
        initializedPreferences.current = true;
        const defaultLeads = [...DEFAULT_NOTIFICATION_LEAD_MINUTES_SET];
        void setPrefs({
            deviceId,
            activeCityCode: cityCode,
            notificationLeadMinutesSet: defaultLeads,
            notificationLeadMinutes:
                defaultLeads[defaultLeads.length - 1] ??
                DEFAULT_NOTIFICATION_LEAD_MINUTES,
        });
    }, [cityCode, deviceId, preferencesQuery, setPrefs]);

    useEffect(() => {
        if (hasPrimedCityCache.current) return;
        hasPrimedCityCache.current = true;
        let cancelled = false;

        (async () => {
            const boundsTiles = buildBoundsTiles(cityConfig.bounds, 4, 4);
            let merged: Segment[] = [];

            for (const tile of boundsTiles) {
                if (cancelled) return;
                try {
                    const tileSegments = (await convex.query(
                        api.streets.getSegmentsInBounds,
                        tile,
                    )) as Segment[];
                    merged = mergeSegments(merged, tileSegments);
                } catch {
                    break;
                }
            }

            if (!cancelled && merged.length > 0) {
                setCachedSegments((previous) =>
                    mergeSegments(previous, merged),
                );
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [cityConfig.bounds, convex]);

    const resolveNearestSegment = useCallback(
        async (latitude: number, longitude: number): Promise<Segment | null> => {
            try {
                return (await convex.query(api.streets.findNearestSegment, {
                    latitude,
                    longitude,
                })) as Segment | null;
            } catch {
                return null;
            }
        },
        [convex],
    );

    const handleSegmentPress = useCallback(
        (segmentId: string) => {
            router.push({
                pathname: "/street-detail",
                params: { segmentId },
            });
        },
        [router],
    );

    const handleParkHere = useCallback(async () => {
        if (!deviceId) return;

        const fallbackLatitude = (bounds.latMin + bounds.latMax) / 2;
        const fallbackLongitude = (bounds.lngMin + bounds.lngMax) / 2;
        const latitude = location?.latitude ?? fallbackLatitude;
        const longitude = location?.longitude ?? fallbackLongitude;

        const nearest = await resolveNearestSegment(latitude, longitude);
        const leads = normalizeLeadMinutesSet(activeLeadMinutesSet);

        await parkCar({
            deviceId,
            latitude,
            longitude,
            streetName: nearest?.streetName,
            segmentId: nearest?.segmentId,
            notificationLeadMinutes:
                leads[leads.length - 1] ?? DEFAULT_NOTIFICATION_LEAD_MINUTES,
            notificationLeadMinutesSet: leads,
        });

        const snapshot: LocalParkedCarSnapshot = {
            latitude,
            longitude,
            streetName: nearest?.streetName ?? null,
            segmentId: nearest?.segmentId ?? null,
            parkedAt: Date.now(),
        };
        setLocalParkedCar(snapshot);
        await saveLocalParkedSnapshot(deviceId, snapshot);

        const granted = await ensureParkingNotificationPermissions();
        if (!granted) {
            Alert.alert(
                "Enable Notifications",
                "Allow notifications and sounds in iOS Settings for sweeping reminders.",
                [
                    { text: "Not Now", style: "cancel" },
                    {
                        text: "Open Settings",
                        onPress: () => {
                            void openSystemNotificationSettings();
                        },
                    },
                ],
            );
        }
    }, [
        activeLeadMinutesSet,
        bounds.latMax,
        bounds.latMin,
        bounds.lngMax,
        bounds.lngMin,
        deviceId,
        location,
        parkCar,
        resolveNearestSegment,
    ]);

    const handleParkingDragEnd = useCallback(
        async (nextLocation: { latitude: number; longitude: number }) => {
            if (!deviceId) return;

            const nearest = await resolveNearestSegment(
                nextLocation.latitude,
                nextLocation.longitude,
            );

            await updateLocation({
                deviceId,
                latitude: nextLocation.latitude,
                longitude: nextLocation.longitude,
                streetName: nearest?.streetName,
                segmentId: nearest?.segmentId,
            });

            const snapshot: LocalParkedCarSnapshot = {
                latitude: nextLocation.latitude,
                longitude: nextLocation.longitude,
                streetName: nearest?.streetName ?? activeParkedCar?.streetName,
                segmentId: nearest?.segmentId ?? activeParkedCar?.segmentId,
                parkedAt: activeParkedCar?.parkedAt ?? Date.now(),
            };
            setLocalParkedCar(snapshot);
            await saveLocalParkedSnapshot(deviceId, snapshot);
        },
        [activeParkedCar?.parkedAt, activeParkedCar?.segmentId, activeParkedCar?.streetName, deviceId, resolveNearestSegment, updateLocation],
    );

    const handleClearParking = useCallback(async () => {
        if (!deviceId) return;
        await clearCar({ deviceId });
        setLocalParkedCar(null);
        await saveLocalParkedSnapshot(deviceId, null);
        await cancelScheduledParkingNotifications();
    }, [clearCar, deviceId]);

    const handleAcceptDisclaimer = useCallback(async () => {
        if (!deviceId) return;
        await setPrefs({
            deviceId,
            hasSeenDisclaimer: true,
            activeCityCode: cityCode,
        });
    }, [cityCode, deviceId, setPrefs]);

    const persistLeadMinutesSet = useCallback(
        async (leadMinutesSet: number[]) => {
            if (!deviceId) return;
            const normalized = normalizeLeadMinutesSet(leadMinutesSet);
            setLocalLeadMinutesSet(normalized);
            await saveLocalLeadMinutesSet(deviceId, normalized);
            await setPrefs({
                deviceId,
                activeCityCode: cityCode,
                notificationLeadMinutesSet: normalized,
                notificationLeadMinutes:
                    normalized[normalized.length - 1] ??
                    DEFAULT_NOTIFICATION_LEAD_MINUTES,
            });
        },
        [cityCode, deviceId, setPrefs],
    );

    const handleSaveDefaultLeads = useCallback(() => {
        void persistLeadMinutesSet([...DEFAULT_NOTIFICATION_LEAD_MINUTES_SET]);
    }, [persistLeadMinutesSet]);

    const handleToggleCustomLead = useCallback(
        (minutes: number) => {
            const current = normalizeLeadMinutesSet(activeLeadMinutesSet);
            const isRemoving = current.includes(minutes);
            if (isRemoving && current.length === 1) return;

            const next = isRemoving
                ? current.filter((value) => value !== minutes)
                : [...current, minutes];
            void persistLeadMinutesSet(next);
        },
        [activeLeadMinutesSet, persistLeadMinutesSet],
    );

    useEffect(() => {
        if (!activeParkedCar) {
            scheduledSignatureRef.current = null;
            void cancelScheduledParkingNotifications();
            return;
        }

        const rules = parkedSegment?.rules ?? [];
        if (rules.length === 0) return;

        const nextSweep = getNextSweepingTime(rules);
        if (!nextSweep) return;

        const leads = normalizeLeadMinutesSet(activeLeadMinutesSet);
        const signature = [
            activeParkedCar.segmentId ?? "unknown",
            nextSweep.getTime(),
            leads.join(","),
        ].join(":");

        if (signature === scheduledSignatureRef.current) {
            return;
        }

        scheduledSignatureRef.current = signature;
        let cancelled = false;
        (async () => {
            const granted = await ensureParkingNotificationPermissions();
            if (!granted || cancelled) return;

            await scheduleParkingNotifications({
                streetName:
                    activeParkedCar.streetName ??
                    parkedSegment?.streetName ??
                    "your street",
                sweepStartTime: nextSweep,
                leadMinutesSet: leads,
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [activeLeadMinutesSet, activeParkedCar, parkedSegment]);

    return (
        <View className="flex-1 bg-[#F2F2F7]">
            <MapDisplay
                segments={allSegments}
                parkedLocation={
                    activeParkedCar
                        ? {
                              latitude: activeParkedCar.latitude,
                              longitude: activeParkedCar.longitude,
                          }
                        : null
                }
                userLocation={location}
                cityCode={cityCode}
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
                onParkedLocationDragEnd={handleParkingDragEnd}
            />

            <SafeAreaView
                edges={["top"]}
                className="pointer-events-none absolute inset-x-0 top-0"
            >
                <View className="pointer-events-auto px-4 pt-2">
                    <SearchBar
                        onSelect={handleSegmentPress}
                        localCandidates={localSearchCandidates}
                    />
                </View>
            </SafeAreaView>

            <View className="absolute left-4 top-24 rounded-xl border border-white/80 bg-white/92 px-3 py-2 shadow-lg">
                <Text className="text-xs font-semibold text-gray-700">
                    San Francisco
                </Text>
                <Text className="text-[11px] text-gray-500">
                    Cached segments: {allSegments.length}
                </Text>
            </View>

            <Legend cityCode={cityCode} />

            {!activeParkedCar && (
                <SafeAreaView
                    edges={["bottom"]}
                    className="absolute inset-x-0 bottom-0 items-center pb-4"
                >
                    <Pressable
                        onPress={handleParkHere}
                        className="rounded-full border border-blue-500 bg-blue-600 px-10 py-4 shadow-xl active:bg-blue-700"
                    >
                        <Text className="text-lg font-bold text-white">
                            I Parked Here
                        </Text>
                    </Pressable>
                </SafeAreaView>
            )}

            {activeParkedCar && (
                <ParkingCard
                    streetName={
                        activeParkedCar.streetName ??
                        parkedSegment?.streetName ??
                        null
                    }
                    rules={parkedSegment?.rules ?? []}
                    parkedAt={activeParkedCar.parkedAt}
                    notificationLeadMinutesSet={activeLeadMinutesSet}
                    onClear={handleClearParking}
                    onOpenNotificationSettings={() =>
                        setShowNotificationSettings(true)
                    }
                />
            )}

            {needsDisclaimer && (
                <DisclaimerModal onAccept={handleAcceptDisclaimer} />
            )}

            <NotificationSettingsModal
                visible={showNotificationSettings}
                currentLeadMinutesSet={activeLeadMinutesSet}
                onClose={() => setShowNotificationSettings(false)}
                onSaveDefault={handleSaveDefaultLeads}
                onToggleCustomLead={handleToggleCustomLead}
                onOpenSystemSettings={() => {
                    void openSystemNotificationSettings();
                }}
            />
        </View>
    );
}
