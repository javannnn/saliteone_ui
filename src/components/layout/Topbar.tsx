import Button from "@/components/ui/button";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { t } from "@/lib/i18n";
import { logout as apiLogout } from "@/lib/api";

export default function Topbar() {
  const { user, clear } = useAuth();
  const { locale, setLocale } = useUI();
  async function doLogout() {
    try { await apiLogout(); } catch {}
    clear();
    window.location.href = "/";
  }
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/70 px-4 backdrop-blur dark:bg-zinc-900/70">
      <div className="font-semibold">Salite One</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-zinc-500">{t("language", locale)}:</span>
          <Button size="sm" variant={locale==="en"?"default":"outline"} onClick={()=>setLocale("en")}>EN</Button>
          <Button size="sm" variant={locale==="am"?"default":"outline"} onClick={()=>setLocale("am")}>AM</Button>
        </div>
        {user ? <div className="text-sm">{user.full_name}</div> : null}
        {user ? <Button variant="outline" onClick={doLogout}>Sign out</Button> : null}
      </div>
    </div>
  );
}
