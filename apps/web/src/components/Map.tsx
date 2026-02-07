"use client";

import { useCallback, useRef, useState } from "react";
import ReactMapGL, {
    Source,
    Layer,
    Marker,
    type MapRef,
    type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapColorStatus, MAP_COLORS } from "@repo/shared";
import type { MapColorStatus } from "@repo/shared";

interface Segment {
    _id: string;
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

interface MapProps {
    segments: Segment[];
    parkedLocation: { latitude: number; longitude: number } | null;
    onBoundsChange: (bounds: {
        latMin: number;
        latMax: number;
        lngMin: number;
        lngMax: number;
    }) => void;
    onSegmentClick: (segment: Segment) => void;
    onParkingDrag: (lat: number, lng: number) => void;
}

const TILE_URL =
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function Map({
    segments,
    parkedLocation,
    onBoundsChange,
    onSegmentClick,
    onParkingDrag,
}: MapProps) {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState({
        latitude: 37.7749,
        longitude: -122.4194,
        zoom: 14,
    });

    const handleMoveEnd = useCallback(
        (evt: ViewStateChangeEvent) => {
            setViewState(evt.viewState);
            const map = mapRef.current;
            if (!map) return;
            const bounds = map.getBounds();
            if (!bounds) return;
            onBoundsChange({
                latMin: bounds.getSouth(),
                latMax: bounds.getNorth(),
                lngMin: bounds.getWest(),
                lngMax: bounds.getEast(),
            });
        },
        [onBoundsChange],
    );

    // Group segments by color status for map layers
    const now = new Date();
    const colorGroups: Record<MapColorStatus, Segment[]> = {
        red: [],
        orange: [],
        yellow: [],
        green: [],
        gray: [],
    };

    for (const seg of segments) {
        const color = getMapColorStatus(seg.rules, now);
        colorGroups[color].push(seg);
    }

    const toGeoJSON = (segs: Segment[]) => ({
        type: "FeatureCollection" as const,
        features: segs.map((seg) => ({
            type: "Feature" as const,
            properties: {
                id: seg._id,
                segmentId: seg.segmentId,
                streetName: seg.streetName,
            },
            geometry: {
                type: "LineString" as const,
                coordinates: seg.coordinates.map((c) => [
                    c.longitude,
                    c.latitude,
                ]),
            },
        })),
    });

    return (
        <ReactMapGL
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onMoveEnd={handleMoveEnd}
            mapStyle={TILE_URL}
            style={{ width: "100%", height: "100%" }}
            onClick={(evt) => {
                const features = evt.features;
                if (features && features.length > 0) {
                    const feature = features[0];
                    const segmentId = feature?.properties?.segmentId;
                    const seg = segments.find(
                        (s) => s.segmentId === segmentId,
                    );
                    if (seg) onSegmentClick(seg);
                }
            }}
            interactiveLayerIds={["streets-red", "streets-orange", "streets-yellow", "streets-green", "streets-gray"]}
        >
            {(
                Object.entries(colorGroups) as [MapColorStatus, Segment[]][]
            ).map(([color, segs]) =>
                segs.length > 0 ? (
                    <Source
                        key={color}
                        id={`streets-${color}`}
                        type="geojson"
                        data={toGeoJSON(segs)}
                    >
                        <Layer
                            id={`streets-${color}`}
                            type="line"
                            paint={{
                                "line-color": MAP_COLORS[color],
                                "line-width": 4,
                                "line-opacity": 0.8,
                            }}
                        />
                    </Source>
                ) : null,
            )}

            {parkedLocation && (
                <Marker
                    latitude={parkedLocation.latitude}
                    longitude={parkedLocation.longitude}
                    draggable
                    onDragEnd={(evt) =>
                        onParkingDrag(evt.lngLat.lat, evt.lngLat.lng)
                    }
                >
                    <div className="flex flex-col items-center">
                        <div className="rounded-full bg-blue-600 p-2 text-white shadow-lg">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                            </svg>
                        </div>
                        <div className="text-xs font-bold text-blue-700">
                            My Car
                        </div>
                    </div>
                </Marker>
            )}
        </ReactMapGL>
    );
}
