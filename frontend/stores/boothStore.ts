import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BoothState {
	boothToken: string | null;
	boothName: string | null;
	setBoothToken: (token: string) => void;
	setBoothName: (name: string) => void;
	clearBooth: () => void;
}

export const useBoothStore = create<BoothState>()(
	persist(
		set => ({
			boothToken: null,
			boothName: null,
			setBoothToken: token => set({ boothToken: token }),
			setBoothName: name => set({ boothName: name }),
			clearBooth: () => set({ boothToken: null, boothName: null })
		}),
		{
			name: "sitcon-booth-storage"
		}
	)
);
