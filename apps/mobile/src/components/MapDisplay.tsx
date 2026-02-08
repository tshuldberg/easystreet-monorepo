import { useRef, useCallback } from "react";
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
    const now = new Date();
    const mapColors = getMapColorsForCity(cityCode);
    const cityCenter = getCityConfig(cityCode).center;

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
                {segments.map((seg) => {
                    const color = getMapColorStatus(seg.rules, now);
                    const coords = seg.coordinates.map((c) => ({
                        latitude: c.latitude,
                        longitude: c.longitude,
                    }));

                    return (
                        <Polyline
                            key={seg._id ?? seg.segmentId}
                            coordinates={coords}
                            strokeColor={mapColors[color]}
                            strokeWidth={4}
                            tappable
                            onPress={() => onSegmentPress(seg.segmentId)}
                        />
                    );
                })}

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
