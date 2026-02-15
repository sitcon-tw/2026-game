import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api";

interface UserState {
  user: User | null;
  authToken: string | null;
  setUser: (user: User) => void;
  setAuthToken: (token: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      authToken: null,
      setUser: (user) => set({ user }),
      setAuthToken: (token) => {
        // Save to cookie for server-side requests
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
        set({ authToken: token });
      },
      clearUser: () => {
        document.cookie = "token=; path=/; max-age=0";
        set({ user: null, authToken: null });
      },
    }),
    {
      name: "sitcon-user-storage",
    }
  )
);
