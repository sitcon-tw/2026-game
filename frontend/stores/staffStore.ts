import { create } from "zustand";

interface StaffState {
	staffName: string | null;
	setStaffName: (name: string) => void;
	clearStaff: () => void;
}

export const useStaffStore = create<StaffState>()(set => ({
	staffName: null,
	setStaffName: name => set({ staffName: name }),
	clearStaff: () => set({ staffName: null })
}));
