import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface Coordinate {
    latitude: number;
    longitude: number;
}

/** Request location permission and return current device coordinates. */
export function useLocation(): Coordinate | null {
    const [location, setLocation] = useState<Coordinate | null>(null);

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        })();
    }, []);

    return location;
}
