import { create } from "zustand";

export enum BrandMode {
  "GENERAL",
  "FOLLOW",
}

export interface AccountActionData {
  mode?: boolean;
  brandMode?: BrandMode;
  trackingMode?: boolean;
}

interface AccountActionStore {
  data: AccountActionData;
  setData: (data: AccountActionData) => void;
}

export const useAccountAction = create<AccountActionStore>((set) => ({
  data: {
    mode: true,
    brandMode: BrandMode.GENERAL,
    trackingMode: true,
  },
  setData: (data: AccountActionData) => set({ data }),
}));
