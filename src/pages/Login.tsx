import { useState } from "react";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { Card } from "@/components/ui/card";

export default function Login() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const { setUser } = useAuth();

  async function submit() {
    setBusy(true); setError(null);
    try {
      await api.post("/api/method/login", { usr: email, pwd: password });
      const r = await api.get("/api/method/frappe.auth.get_logged_user");
      setUser({ name: r.data.message, full_name: email, roles: [] });
    } catch (e:any) {
      setError("Login failed.");
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
