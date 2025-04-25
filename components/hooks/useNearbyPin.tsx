import { create } from "zustand";
import { ConsumedLocation } from "../types/CollectionTypes";

export interface PinData {
  nearbyPins?: ConsumedLocation[];
  singleAR?: boolean;
  nearestPinDistance?: number;
}

interface PinStore {
  data: PinData;
  setData: (data: PinData) => void;
}

export const useNearByPin = create<PinStore>((set) => ({
  data: {
    nearbyPins: [],
    singleAR: false,
    nearestPinDistance: 0,
  },
  setData: (data: PinData) => set({ data }),
}));
