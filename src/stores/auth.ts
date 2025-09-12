import { create } from "zustand";

export type User = { name: string; full_name: string };

type S = {
  user: User | null;
  roles: string[];
  setSession: (u: User, roles: string[]) => void;
  clear: () => void;
  hydrate: (u: User | null, roles: string[]) => void;
};

function load() {
  try {
    return JSON.parse(localStorage.getItem("auth") || '{"user":null,"roles":[]}');
  } catch {
    return { user: null, roles: [] };
  }
}

export const useAuth = create<S>((set) => ({
  ...load(),
  setSession: (u, roles) => {
    const v = { user: u, roles };
    try { localStorage.setItem("auth", JSON.stringify(v)); } catch {}
    set(v);
  },
  clear: () => {
    try { localStorage.removeItem("auth"); } catch {}
    set({ user: null, roles: [] });
  },
  hydrate: (u, roles) => set({ user: u, roles })
}));
