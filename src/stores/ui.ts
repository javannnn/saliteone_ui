import { create } from "zustand";

export type Locale = "en" | "am";
export type Perms = Record<string, boolean>;

type S = {
  perms: Perms;
  setPerms: (p: Perms) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
};

export const useUI = create<S>((set) => ({
  perms: {},
  setPerms: (p) => set({ perms: p }),
  locale: (localStorage.getItem("locale") as Locale) || "en",
  setLocale: (l) => {
    localStorage.setItem("locale", l);
    set({ locale: l });
  }
}));

