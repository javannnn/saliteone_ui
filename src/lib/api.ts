import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

export async function ping() {
  const r = await api.get("/api/method/ping");
  return r.data;
}

export type Process = { name: string; title: string; status: string };
export async function listProcesses() {
  const r = await api.get("/api/resource/SM_Process", {
    params: { fields: '["name","title","status"]', limit_page_length: 100 }
  });
  return r.data.data as Process[];
}
