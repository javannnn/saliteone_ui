import Button from "@/components/ui/button";
import { useAuth } from "@/stores/auth";

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/70 px-4 backdrop-blur dark:bg-zinc-900/70">
      <div className="font-semibold">Salite One</div>
      <div className="flex items-center gap-3">
        {user ? <div className="text-sm">{user.full_name}</div> : null}
        {user ? <Button variant="outline" onClick={logout}>Sign out</Button> : null}
      </div>
    </div>
  );
}
