import { create } from "zustand";
import type { User } from "@/lib/types";

type S = { user: User | null; setUser: (u: User | null) => void; logout: () => void };
export const useAuth = create<S>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: () => set({ user: null })
}));
