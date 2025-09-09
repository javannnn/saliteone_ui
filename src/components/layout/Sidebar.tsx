import { NavLink } from "react-router-dom";

const link = "block rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800";
const active = "bg-zinc-100 dark:bg-zinc-800";

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r p-3 md:block">
      <nav className="space-y-1">
        <NavLink to="/" end className={({isActive}) => `${link} ${isActive?active:""}`}>Dashboard</NavLink>
        <NavLink to="/processes" className={({isActive}) => `${link} ${isActive?active:""}`}>Processes</NavLink>
      </nav>
    </aside>
  );
}
