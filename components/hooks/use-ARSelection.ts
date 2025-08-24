import { create } from "zustand"

export interface ARSelectionData {
    visible?: boolean
}

interface ARSelectionStore {
    data: ARSelectionData

    setVisible: (visible: boolean) => void

    closeModal: () => void
    resetSelection: () => void
}

export const useARSelection = create<ARSelectionStore>((set, get) => ({
    data: {
        visible: false,

    },

    setVisible: (visible) => {
        set((state) => ({
            data: { ...state.data, visible },
        }))
    },



    closeModal: () => {
        set({ data: { visible: false } })
    },

    resetSelection: () => {
        set({ data: { visible: false } })
    },

}))
