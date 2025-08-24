import { create } from "zustand";
import { ConsumedLocation } from "../types/CollectionTypes";
import {
  getNearbyPins,
  getDistanceFromLatLonInMeters,
  calculateBearing,
} from "../utils/map";

interface LocationServiceState {
  userLocation: { latitude: number; longitude: number } | null;
  allLocations: ConsumedLocation[];
  nearbyPins: ConsumedLocation[];
  nearestPin: ConsumedLocation | null;
  nearestPinDistance: number | null;
  nearestPinDistanceForAR: number | null;
  singleAr?: boolean;

  // Actions
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  setAllLocations: (locations: ConsumedLocation[]) => void;
  calculateNearbyData: () => void;
  setSingleAr: (location?: ConsumedLocation) => void;
  setMultipleAr: () => void;
}

export const useLocationService = create<LocationServiceState>((set, get) => ({
  userLocation: null,
  allLocations: [],
  nearbyPins: [],
  nearestPin: null,
  nearestPinDistance: null,
  nearestPinDistanceForAR: null,
  singleAr: undefined,

  setUserLocation: (userLocation) => {
    set({ userLocation });
    get().calculateNearbyData();
  },

  setAllLocations: (allLocations) => {
    set({ allLocations });
    get().calculateNearbyData();
  },

  calculateNearbyData: () => {
    const { userLocation, allLocations } = get();
    if (!userLocation || allLocations.length === 0) return;

    // Calculate nearby pins
    const nearbyPins = getNearbyPins(userLocation, allLocations, 75);

    // Calculate nearest pin
    let nearest = null;
    let minDistance = Number.POSITIVE_INFINITY;
    let minDistanceForAR = Number.POSITIVE_INFINITY;
    allLocations.forEach((location) => {
      if (location.collected || location.collection_limit_remaining <= 0)
        return;
      if (!location.auto_collect) {
        const distance = getDistanceFromLatLonInMeters(
          userLocation.latitude,
          userLocation.longitude,
          location.lat,
          location.lng
        );

        if (distance < minDistanceForAR) {
          minDistanceForAR = distance;
          nearest = location;
        }
      }

      const distance = getDistanceFromLatLonInMeters(
        userLocation.latitude,
        userLocation.longitude,
        location.lat,
        location.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = location;
      }

    });
    set({
      nearbyPins,
      nearestPin: nearest,
      nearestPinDistance:
        minDistance === Number.POSITIVE_INFINITY ? null : minDistance,
      nearestPinDistanceForAR:
        minDistanceForAR === Number.POSITIVE_INFINITY ? null : minDistanceForAR,
    });
  },

  getNearbyPinsForAR: (radius = 75) => {
    const { userLocation, allLocations } = get();
    if (!userLocation || allLocations.length === 0) return [];
    return getNearbyPins(userLocation, allLocations, radius);
  },
  setSingleAr: (location) =>
    set({ singleAr: true, nearbyPins: location ? [location] : [] }),
  setMultipleAr: () => {
    set({ singleAr: false });
    get().calculateNearbyData();
  },

}));
