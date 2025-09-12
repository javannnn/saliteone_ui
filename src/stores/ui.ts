import { create } from "zustand";

export type Locale = "en" | "am";
export type Perms = Record<string, boolean>;

type S = {
  perms: Perms;
  setPerms: (p: Perms) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
};

function load<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d; } catch { return d; }
}

export const useUI = create<S>((set) => ({
  perms: {},
  setPerms: (p) => set({ perms: p }),
  locale: load<Locale>("locale", "en"),
  setLocale: (l) => { try { localStorage.setItem("locale", JSON.stringify(l)); } catch {} set({ locale: l }); },
  theme: load<"light"|"dark"|"system">("theme", "system"),
  setTheme: (t) => { try { localStorage.setItem("theme", JSON.stringify(t)); } catch {} set({ theme: t }); },
  navOpen: load<boolean>("navOpen", true),
  setNavOpen: (v) => { try { localStorage.setItem("navOpen", JSON.stringify(v)); } catch {} set({ navOpen: v }); }
}));
