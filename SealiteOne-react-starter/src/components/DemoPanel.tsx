import { useEffect, useState } from "react";
import { login, whoami, logout } from "../api/auth";
import { createProcess, addStep, advance } from "../api/workflow";

export default function DemoPanel() {
  const [user, setUser] = useState<{user:string, full_name?:string, roles?:string[]} | null>(null);
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [status, setStatus] = useState<string>("");
  const [procName, setProcName] = useState<string>("");

  async function refresh() {
    try {
      const me = await whoami();
      setUser(me);
    } catch (e) {
      setUser(null);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleLogin() {
    setStatus("Logging in...");
    try {
      await login(usr, pwd);
      await refresh();
      setStatus("Logged in");
    } catch (e: any) {
      setStatus("Login failed");
    }
  }

  async function handleLogout() {
    await logout();
    await refresh();
  }

  async function doCreate() {
    setStatus("Creating process...");
    const res = await createProcess("Onboard Volunteer");
    setProcName(res.name);
    setStatus("Created " + res.name);
  }

  async function doAddStep() {
    if (!procName) { setStatus("Create a process first"); return; }
    setStatus("Adding step...");
    const res = await addStep(procName, "Review Form", 1);
    setStatus("Step " + res.name + " added");
  }

  async function doAdvance() {
    if (!procName) { setStatus("Create a process first"); return; }
    setStatus("Advancing...");
    const res = await advance(procName, "Review Form");
    setStatus("Advanced to " + res.status);
  }

  return (
    <div style={{maxWidth: 640, margin: "2rem auto", padding: "1rem", border: "1px solid #ddd", borderRadius: 12}}>
      <h2>SealiteOne Demo</h2>
      <p>API: {import.meta.env.VITE_API_URL || "http://localhost:8000"}</p>

      <div style={{display: "grid", gap: 8, marginTop: 12}}>
        {user ? (
          <>
            <div><strong>Logged in as:</strong> {user.user} {user.full_name ? `(${user.full_name})` : ""}</div>
            <div><strong>Roles:</strong> {(user.roles || []).join(", ")}</div>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <input placeholder="Email" value={usr} onChange={e => setUsr(e.target.value)} />
            <input placeholder="Password" value={pwd} type="password" onChange={e => setPwd(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
          </>
        )}

        <hr />

        <button onClick={doCreate}>Create Process</button>
        <button onClick={doAddStep}>Add Step</button>
        <button onClick={doAdvance}>Advance</button>

        <div style={{minHeight: 24}}>{status}</div>
      </div>
    </div>
  );
}
