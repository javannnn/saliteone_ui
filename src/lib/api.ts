import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  // Use Vite dev proxy in development; production can serve under same origin
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

export async function ping() {
  const r = await api.get("/method/ping");
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

export async function createProcess(input: { title: string; status?: string }) {
  const doctype = encodeURIComponent("Workflow Process");
  const r = await api.post(`/resource/${doctype}`, {
    title: input.title,
    status: input.status || "Draft"
  });
  return r.data.data as Process;
}

// KPIs
export async function getMyTaskCount() {
  const r = await api.get("/method/frappe.client.get_count", {
    params: { doctype: "ToDo", filters: JSON.stringify({ status: "Open" }) }
  });
  return Number(r.data.message || 0);
}

export async function getPendingApprovalsCount() {
  const r = await api.get("/method/frappe.client.get_count", {
    params: { doctype: "Workflow Process", filters: JSON.stringify({ status: "Pending" }) }
  });
  return Number(r.data.message || 0);
}

export type RecentItem = { name: string; title: string; status: string; modified: string; modified_by: string };
export async function getRecentActivity(limit = 5) {
  const doctype = encodeURIComponent("Workflow Process");
  const r = await api.get(`/resource/${doctype}`, {
    params: {
      fields: '["name","title","status","modified","modified_by"]',
      order_by: "modified desc",
      limit_page_length: limit
    }
  });
  return r.data.data as RecentItem[];
}

export async function getProcessStatusBuckets() {
  const doctype = encodeURIComponent("Workflow Process");
  const r = await api.get(`/resource/${doctype}`, {
    params: { fields: '["name","status"]', limit_page_length: 1000 }
  });
  const rows = r.data.data as Array<{ status: string }>;
  const buckets: Record<string, number> = {};
  for (const row of rows) buckets[row.status] = (buckets[row.status] || 0) + 1;
  return buckets;
}

// Permissions
export async function hasPermission(doctype: string, ptype = "read") {
  const r = await api.get("/method/frappe.has_permission", { params: { doctype, ptype } });
  return !!r.data.message;
}

export async function bootstrapPermissions(dts: string[]) {
  const entries = await Promise.all(
    dts.map(async (d) => [d, await hasPermission(d, "read")] as const)
  );
  return Object.fromEntries(entries) as Record<string, boolean>;
}

// Interceptors
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      window.location.href = "/";
    }
    if (!err?.response) {
      toast.error("Network error");
    }
    return Promise.reject(err);
  }
);
