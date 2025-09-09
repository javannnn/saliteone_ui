import axios from "axios";

export const api = axios.create({
  // Use Vite dev proxy in development; production can serve under same origin
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

export async function ping() {
  const r = await api.get("/api/method/ping");
  return r.data;
}

export type Process = { name: string; title: string; status: string };
export async function listProcesses() {
  const doctype = encodeURIComponent("Workflow Process");
  const r = await api.get(`/resource/${doctype}`, {
    params: { fields: '["name","title","status"]', limit_page_length: 100 }
  });
  return r.data.data as Process[];
}
