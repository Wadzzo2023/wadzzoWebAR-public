import { Dimensions } from "react-native";
import { ConsumedLocation } from "../types/CollectionTypes";

type userLocationType = {
    latitude: number;
    longitude: number;
};

export const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const calculateBearing = (
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number
): number => {
    // Convert to radians
    const φ1 = (startLat * Math.PI) / 180;
    const φ2 = (destLat * Math.PI) / 180;
    const Δλ = ((destLng - startLng) * Math.PI) / 180;

    // Calculate bearing
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    let θ = Math.atan2(y, x);

    // Convert to degrees
    θ = (θ * 180) / Math.PI;
    return (θ + 360) % 360;
};

export const getNearbyPins = (
    userLocation: userLocationType,
    locations: ConsumedLocation[],
    radius: number
) => {
    return locations.filter((location) => {
        if (
            location.auto_collect ||
            location.collection_limit_remaining <= 0 ||
            location.collected
        )
            return false;
        const distance = getDistanceFromLatLonInMeters(
            userLocation.latitude,
            userLocation.longitude,
            location.lat,
            location.lng
        );
        return distance <= radius;
    });
};

export const getAutoCollectPins = (
    userLocation: userLocationType | null,
    locations: ConsumedLocation[],
    radius: number
) => {
    if (!userLocation) return []; // Exit early if userLocation is null
    return locations.filter((location) => {
        if (location.collection_limit_remaining <= 0 || location.collected)
            return false;
        if (location.auto_collect) {
            const distance = getDistanceFromLatLonInMeters(
                userLocation.latitude,
                userLocation.longitude,
                location.lat,
                location.lng
            );
            return distance <= radius;
        }
    });
};

/**
 * Given an angle (in degrees) and container dimensions,
 * returns the { top, left } position (in pixels) at which a ray
 * from the center (width/2, height/2) at that angle will hit the edge.
 *
 * In this coordinate system:
 * - (0,0) is the top left.
 * - x increases to the right.
 * - y increases downward.
 *
 * For example, in a square:
 *   getEdgePosition(90, w, w)  returns { top: 0, left: w/2 }    // top center
 *   getEdgePosition(135, w, w) returns { top: 0, left: 0 }      // top left
 *   getEdgePosition(180, w, w) returns { top: w/2, left: 0 }    // left center
 *   getEdgePosition(225, w, w) returns { top: w, left: 0 }      // bottom left
 *   getEdgePosition(270, w, w) returns { top: w, left: w/2 }    // bottom center
 *   getEdgePosition(315, w, w) returns { top: w, left: w }      // bottom right
 *   getEdgePosition(360, w, w) returns { top: w/2, left: w }    // right center
 *
 * @param deg - the angle in degrees (0 to 360)
 * @param width - container width in pixels
 * @param height - container height in pixels
 */
export function getEdgePosition(deg: number): { top: number; left: number } {
    const width = Dimensions.get("window").width
    const height = Dimensions.get("window").height

    const rad = (deg * Math.PI) / 180;

    // The center of the container.
    const cx = width / 2;
    const cy = height / 2;

    // In standard math, 0° is along +x and 90° is along +y.
    // But since CSS y increases downward, we flip the y component.
    const dx = Math.cos(rad);
    const dy = -Math.sin(rad);

    // We'll compute a parameter "t" so that:
    //    (x, y) = (cx, cy) + t * (dx, dy)
    // is the intersection with one of the four boundaries.
    let tX = Infinity;
    let tY = Infinity;

    // Check vertical boundaries (left: x=0 or right: x=width)
    if (dx > 0) {
        // Ray going right: intersect with right edge.
        tX = ((width - cx) / dx) - 100;
    } else if (dx < 0) {
        // Ray going left: intersect with left edge.
        tX = ((0 - cx) / dx) - 60;
    }

    // Check horizontal boundaries (top: y=0 or bottom: y=height)
    if (dy > 0) {
        // Ray going down: intersect with bottom edge.
        tY = ((height - cy) / dy) - 100;
    } else if (dy < 0) {
        // Ray going up: intersect with top edge.
        tY = ((0 - cy) / dy) - 60;
    }

    // Use the smallest t (the first boundary hit)
    const t = Math.min(tX, tY);
    const x = cx + t * dx;
    const y = cy + t * dy;

    return { top: y, left: x };
}

