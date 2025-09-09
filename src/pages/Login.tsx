import { useState } from "react";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";
// avoid importing `api` here to prevent collisions
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { bootstrapPermissions, login, getLoggedUser } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function Login() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const { setUser } = useAuth();
  const { setPerms } = useUI();

  async function submit() {
    setBusy(true); setError(null);
    try {
      await login(email, password);
      const userId = await getLoggedUser();
      let roles: string[] = [];
      try {
        const resp = await fetch("/api/method/frappe.get_roles");
        const data = await resp.json();
        roles = data?.message || [];
      } catch {}
      setUser({ name: userId, full_name: email, roles });

      // Bootstrap permissions for key doctypes
      const doctypes = [
        "Member","Payment","Sponsorship","Newcomer","Volunteer","Media Request","School Enrollment","Workflow Process"
      ];
      const perms = await bootstrapPermissions(doctypes);
      setPerms(perms);
    } catch (e:any) {
      console.error(e?.response || e);
      setError("Login failed: " + (e?.response?.data?.message || e?.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
        <div className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button onClick={submit} disabled={busy}>{busy?"Signing in…":"Sign in"}</Button>
        </div>
      </Card>
    </div>
  );
}
