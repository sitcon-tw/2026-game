import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StaffState {
  staffToken: string | null;
  staffName: string | null;
  setStaffToken: (token: string) => void;
  setStaffName: (name: string) => void;
  clearStaff: () => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      staffToken: null,
      staffName: null,
      setStaffToken: (token) => set({ staffToken: token }),
      setStaffName: (name) => set({ staffName: name }),
      clearStaff: () => set({ staffToken: null, staffName: null }),
    }),
    {
      name: "sitcon-staff-storage",
    }
  )
);
