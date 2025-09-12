import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  // Use Vite dev proxy in development; production can serve under same origin
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

// (removed duplicate early auth helpers)

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

// Interceptors / Global handlers
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (!err?.response) {
      toast.error("Network error");
      return Promise.reject(err);
    }
    if (err.response.status === 401) {
      try { localStorage.removeItem("auth"); } catch {}
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// Auth helpers
export async function login(usr: string, pwd: string) {
  const body = new URLSearchParams();
  body.set("usr", usr);
  body.set("pwd", pwd);
  return api.post("/method/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
}

export type WhoAmI = { user: string; full_name: string; roles: string[] };
export async function whoami(): Promise<WhoAmI> {
  const r = await api.get("/method/salitemiret.api.auth.whoami");
  return (r.data?.message ?? r.data) as WhoAmI;
}

export async function logout() {
  await api.post("/method/logout");
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

// Generic CRUD helpers
export async function getDoc<T = any>(doctype: string, name: string, fields?: string[]) {
  const r = await api.get(`/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    params: fields ? { fields: JSON.stringify(fields) } : undefined
  });
  return r.data.data as T;
}

export async function updateDoc<T = any>(doctype: string, name: string, data: Record<string, any>) {
  const r = await api.put(`/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, data);
  return r.data.data as T;
}

export async function deleteDoc(doctype: string, name: string) {
  await api.delete(`/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
}

// Module lists (minimal fields)
export type MemberRow = { name: string; first_name: string; last_name: string; status: string };
export async function listMembers() {
  const dt = encodeURIComponent("Member");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","first_name","last_name","status"]', limit_page_length: 20 }
  });
  return r.data.data as MemberRow[];
}

export type PaymentRow = { name: string; member: string; amount: number; status: string };
export async function listPayments() {
  const dt = encodeURIComponent("Payment");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","member","amount","status"]', limit_page_length: 20 }
  });
  return r.data.data as PaymentRow[];
}

export type SponsorshipRow = { name: string; sponsor: string; frequency: string };
export async function listSponsorships() {
  const dt = encodeURIComponent("Sponsorship");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","sponsor","frequency"]', limit_page_length: 20 }
  });
  return r.data.data as SponsorshipRow[];
}

export type NewcomerRow = { name: string; full_name: string; family_size?: number };
export async function listNewcomers() {
  const dt = encodeURIComponent("Newcomer");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","full_name","family_size"]', limit_page_length: 20 }
  });
  return r.data.data as NewcomerRow[];
}

export type VolunteerRow = { name: string; member: string; group?: string };
export async function listVolunteers() {
  const dt = encodeURIComponent("Volunteer");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","member","group"]', limit_page_length: 20 }
  });
  return r.data.data as VolunteerRow[];
}

export type MediaRequestRow = { name: string; title: string; status: string };
export async function listMediaRequests() {
  const dt = encodeURIComponent("Media Request");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","title","status"]', limit_page_length: 20 }
  });
  return r.data.data as MediaRequestRow[];
}

export type SchoolEnrollmentRow = { name: string; member?: string; child_name?: string; school_type: string };
export async function listSchoolEnrollments() {
  const dt = encodeURIComponent("School Enrollment");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","member","child_name","school_type"]', limit_page_length: 20 }
  });
  return r.data.data as SchoolEnrollmentRow[];
}

// (removed duplicate interceptor)
