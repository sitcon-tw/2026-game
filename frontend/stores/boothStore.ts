import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BoothState {
	boothName: string | null;
	setBoothName: (name: string) => void;
	clearBooth: () => void;
}

export const useBoothStore = create<BoothState>()(
	persist(
		set => ({
			boothName: null,
			setBoothName: name => set({ boothName: name }),
			clearBooth: () => set({ boothName: null })
		}),
		{ name: "booth-store" }
	)
);
