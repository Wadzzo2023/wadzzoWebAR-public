import { create } from "zustand";
import { ConsumedLocation } from "../types/CollectionTypes";
import { Bounty } from "../types/BountyTypes";

export type ModalType =
  | "Delete"
  | "LocationInformation"
  | "JoinBounty"
  | "NearbyPin";

export interface ModalData {
  collectionId?: string;
  collectionName?: string;
  Collection?: ConsumedLocation;
  userCurrentBalance?: number;
  balance?: number | undefined;
  bounty?: Bounty;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  setData: (data: ModalData) => void;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  setData: (data) => set({ data }),
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
