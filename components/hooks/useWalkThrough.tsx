import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface walkThroughData {
  showWalkThrough?: boolean;
}

interface walkThroughStore {
  data: walkThroughData;
  setData: (data: walkThroughData) => void;
  loadData: () => void;
}

export const useWalkThrough = create<walkThroughStore>((set) => ({
  data: {
    showWalkThrough: true,
  },
  setData: (data: walkThroughData) => {
    set({ data });

    AsyncStorage.setItem("walkThroughData", JSON.stringify(data));
  },
  loadData: async () => {
    try {
      const isFirstLoad = await AsyncStorage.getItem("isFirstSignIn");

      if (isFirstLoad === "true") {
        set({ data: { showWalkThrough: true } });
      } else {
        set({ data: { showWalkThrough: false } });
      }

      if (isFirstLoad === null) {
        AsyncStorage.setItem("isFirstSignIn", "true");
      }
    } catch (error) {
      console.error("Error loading walkThrough data from AsyncStorage", error);
    }
  },
}));

useWalkThrough.getState().loadData();
