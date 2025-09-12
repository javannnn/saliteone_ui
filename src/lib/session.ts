import { useAuth } from "@/stores/auth";

export function initAuthStorageSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (e) => {
    if (e.key !== "auth") return;
    try {
      const next = e.newValue ? JSON.parse(e.newValue) : { user: null, roles: [] };
      useAuth.getState().hydrate(next.user, next.roles || []);
    } catch {
      useAuth.getState().clear();
    }
  });
}

