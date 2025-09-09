import { NavLink } from "react-router-dom";
import { useUI } from "@/stores/ui";
import { t } from "@/lib/i18n";
import { useUI as useUIStore } from "@/stores/ui";

const link = "block rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800";
const active = "bg-zinc-100 dark:bg-zinc-800";

export default function Sidebar() {
  const { perms, locale } = useUIStore();
  const can = (key: string, el: JSX.Element) => (perms[key] ?? true) ? el : null;
  return (
    <aside className="hidden w-64 shrink-0 border-r p-3 md:block">
      <nav className="space-y-1">
        <NavLink to="/" end className={({isActive}) => `${link} ${isActive?active:""}`}>{t("dashboard", locale)}</NavLink>
        <NavLink to="/processes" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("processes", locale)}</NavLink>
        {can("Member", <NavLink to="/members" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("members", locale)}</NavLink>)}
        {can("Payment", <NavLink to="/payments" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("payments", locale)}</NavLink>)}
        {can("Sponsorship", <NavLink to="/sponsorships" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("sponsorships", locale)}</NavLink>)}
        {can("Newcomer", <NavLink to="/newcomers" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("newcomers", locale)}</NavLink>)}
        {can("Volunteer", <NavLink to="/volunteers" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("volunteers", locale)}</NavLink>)}
        {can("Media Request", <NavLink to="/media" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("media", locale)}</NavLink>)}
        {can("School Enrollment", <NavLink to="/schools" className={({isActive}) => `${link} ${isActive?active:""}`}>{t("schools", locale)}</NavLink>)}
      </nav>
    </aside>
  );
}
