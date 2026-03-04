import { create } from "zustand";

export interface PopupData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  cta?: {
    name: string;
    link: string;
  };
  doneText?: string;
}

interface PopupState {
  popups: PopupData[];
  showPopup: (popup: Omit<PopupData, "id">) => void;
  dismissPopup: (id: string) => void;
  clearAll: () => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  popups: [],
  showPopup: (popup) =>
    set((state) => ({
      popups: [
        ...state.popups,
        { ...popup, id: crypto.randomUUID() },
      ],
    })),
  dismissPopup: (id) =>
    set((state) => ({
      popups: state.popups.filter((p) => p.id !== id),
    })),
  clearAll: () => set({ popups: [] }),
}));
