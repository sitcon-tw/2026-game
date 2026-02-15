import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BoothState {
    boothToken: string | null;
    boothName: string | null;
    boothDescription: string | null;
    setBoothToken: (token: string) => void;
    setBoothName: (name: string) => void;
    setBoothDescription: (description: string) => void;
    clearBooth: () => void;
}

export const useBoothStore = create<BoothState>()(
    persist(
        (set) => ({
            boothToken: null,
            boothName: null,
            boothDescription: null,
            setBoothToken: (token) => set({ boothToken: token }),
            setBoothName: (name) => set({ boothName: name }),
            setBoothDescription: (description) => set({ boothDescription: description }),
            clearBooth: () => set({ boothToken: null, boothName: null, boothDescription: null }),
        }),
        {
            name: "sitcon-booth-storage",
        }
    )
);
