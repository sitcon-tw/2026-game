import { create } from "zustand";

interface BoothState {
	boothName: string | null;
	setBoothName: (name: string) => void;
	clearBooth: () => void;
}

export const useBoothStore = create<BoothState>()(set => ({
	boothName: null,
	setBoothName: name => set({ boothName: name }),
	clearBooth: () => set({ boothName: null })
}));
