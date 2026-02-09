import { useRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import MapView, { Polyline, Marker, type Region } from "react-native-maps";
import {
    getMapColorStatus,
    getMapColorsForCity,
    getCityConfig,
} from "@repo/shared";

interface Segment {
    _id?: string;
    segmentId: string;
    streetName: string;
    coordinates: { latitude: number; longitude: number }[];
    rules: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        weeksOfMonth: number[];
        applyOnHolidays: boolean;
    }[];
}

interface MapDisplayProps {
    segments: Segment[];
    parkedLocation: { latitude: number; longitude: number } | null;
    userLocation: { latitude: number; longitude: number } | null;
    onRegionChange: (region: Region) => void;
    onSegmentPress: (segmentId: string) => void;
    onParkedLocationDragEnd?: (location: {
        latitude: number;
        longitude: number;
    }) => void;
    cityCode?: string;
}

export function MapDisplay({
    segments,
    parkedLocation,
    userLocation,
    onRegionChange,
    onSegmentPress,
    onParkedLocationDragEnd,
    cityCode,
}: MapDisplayProps) {
    const mapRef = useRef<MapView>(null);
    const mapColors = getMapColorsForCity(cityCode);
    const cityCenter = getCityConfig(cityCode).center;
    const dayKey = new Date().toDateString();

    const segmentsWithColors = useMemo(() => {
        const referenceDate = new Date(dayKey);
        return segments.map((segment) => ({
            segment,
            color: getMapColorStatus(segment.rules, referenceDate),
            coordinates: segment.coordinates.map((coordinate) => ({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
            })),
        }));
    }, [dayKey, segments]);

    const handleRegionChangeComplete = useCallback(
        (region: Region) => {
            onRegionChange(region);
        },
        [onRegionChange],
    );

    return (
        <View className="flex-1">
            <MapView
                ref={mapRef}
                className="flex-1"
                initialRegion={{
                    latitude: userLocation?.latitude ?? cityCenter.latitude,
                    longitude:
                        userLocation?.longitude ?? cityCenter.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                showsUserLocation
                showsMyLocationButton
                userInterfaceStyle="light"
                onRegionChangeComplete={handleRegionChangeComplete}
            >
                {segmentsWithColors.map(({ segment, color, coordinates }) => (
                    <Polyline
                        key={segment._id ?? segment.segmentId}
                        coordinates={coordinates}
                        strokeColor={mapColors[color]}
                        strokeWidth={4}
                        tappable
                        onPress={() => onSegmentPress(segment.segmentId)}
                    />
                ))}

                {parkedLocation && (
                    <Marker
                        coordinate={parkedLocation}
                        title="My Car"
                        draggable
                        onDragEnd={(e) =>
                            onParkedLocationDragEnd?.(
                                e.nativeEvent.coordinate,
                            )
                        }
                    />
                )}
            </MapView>
        </View>
    );
}
