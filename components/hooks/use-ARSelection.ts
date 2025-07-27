import { create } from "zustand"

export interface ARSelectionData {
    visible?: boolean
    selectAR?: boolean
    selectQR?: boolean
    tutorialMode?: boolean
}

interface ARSelectionStore {
    data: ARSelectionData
    setVisible: (visible: boolean) => void
    setSelectAR: (selectAR: boolean) => void
    setSelectQR: (selectQR: boolean) => void
    setTutorialMode: (tutorialMode: boolean) => void
    closeModal: () => void
    resetSelection: () => void
}

export const useARSelection = create<ARSelectionStore>((set, get) => ({
    data: {
        visible: false,
        selectAR: false,
        selectQR: false,
        tutorialMode: false,
    },

    setVisible: (visible) => {
        set((state) => ({
            data: { ...state.data, visible },
        }))
    },

    setSelectAR: (selectAR) => {
        set((state) => ({
            data: { ...state.data, selectAR },
        }))
    },

    setSelectQR: (selectQR) => {
        set((state) => ({
            data: { ...state.data, selectQR },
        }))
    },
    setTutorialMode: (tutorialMode) => {
        set((state) => ({
            data: { ...state.data, tutorialMode },
        }))
    },
    closeModal: () => {
        set({ data: { visible: false, selectAR: false, selectQR: false, tutorialMode: false } })
    },

    resetSelection: () => {
        set({ data: { visible: false, selectAR: false, selectQR: false, tutorialMode: false } })
    },

}))
