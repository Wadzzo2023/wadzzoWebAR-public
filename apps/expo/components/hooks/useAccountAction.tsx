import { create } from "zustand";

export interface AccountActionData {
  mode: boolean;
}

interface AccountActionStore {
  data: AccountActionData;
  setData: (data: AccountActionData) => void;
}

export const useAccountAction = create<AccountActionStore>((set) => ({
  data: {
    mode: true,
  },
  setData: (data: AccountActionData) => set({ data }),
}));
