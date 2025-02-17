import { create } from "zustand";

type UserLocationType = {
    latitude: number;
    longitude: number;
};

export interface DirectionDataType {
    currentLocation?: UserLocationType;
    destinationLocation?: UserLocationType;
}

interface DirectionStoreProps {
    data?: DirectionDataType;
    setData: (
        update: Partial<DirectionDataType> | ((prevData?: DirectionDataType) => Partial<DirectionDataType>)
    ) => void;
}

export const useDirectionStore = create<DirectionStoreProps>((set) => ({
    data: undefined,
    setData: (update) =>
        set((state) => ({
            data:
                typeof update === "function"
                    ? { ...state.data, ...update(state.data) } // Functional update
                    : { ...state.data, ...update }, // Direct object update
        })),
}));
