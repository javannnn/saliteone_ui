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
const SKIP_REDIRECT_KEY = "__skipAuthRedirect" as const;

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const s = err?.response?.status;
    if (!err?.response) {
      toast.error("Network error");
      return Promise.reject(err);
    }
    const skip = err?.config && (err.config as any)[SKIP_REDIRECT_KEY];
    if (!skip && (s === 401 || s === 403)) {
      try { localStorage.removeItem("auth"); } catch {}
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
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
  const r = await api.get("/method/salitemiret.api.auth.whoami", { [SKIP_REDIRECT_KEY]: true } as any);
  return (r.data?.message ?? r.data) as WhoAmI;
}

export async function logout() {
  // Use GET to avoid CSRF issues in dev; mark to skip redirect handling
  await api.get("/method/logout", { [SKIP_REDIRECT_KEY]: true } as any);
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

export async function getProcessStatusBuckets(): Promise<Array<{ status: string; count: number }>> {
  const doctype = encodeURIComponent("Workflow Process");
  const r = await api.get(`/resource/${doctype}`, {
    params: { fields: JSON.stringify(["status"]), limit_page_length: 500, order_by: "modified desc" }
  });
  const rows = r.data.data as Array<{ status?: string }>;
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = row.status || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map, ([status, count]) => ({ status, count }));
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
  // Upgraded volunteer list with services and higher limit
  const dt = encodeURIComponent("Volunteer");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: JSON.stringify(["name","member","group","services"]), order_by: "modified desc", limit_page_length: 200 }
  });
  return r.data.data as Array<{ name:string; member:string; group?:string; services?:string }>;
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

// ---------- Generic list ----------
export async function listDocs<T = any>(doctype: string, opts: {
  fields?: string[]; filters?: Record<string, any>; order_by?: string; limit?: number
} = {}) {
  const r = await api.get(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      ...(opts.fields ? { fields: JSON.stringify(opts.fields) } : {}),
      ...(opts.filters ? { filters: JSON.stringify(opts.filters) } : {}),
      ...(opts.order_by ? { order_by: opts.order_by } : {}),
      ...(opts.limit ? { limit_page_length: opts.limit } : {}),
    }
  });
  return r.data.data as T[];
}

// ---------- Member lookup by email ----------
export async function getMemberByEmail(email: string) {
  const rows = await listDocs<{ name: string; first_name?: string; last_name?: string; email?: string }>("Member", {
    fields: ["name","first_name","last_name","email"], filters: { email }, limit: 1
  });
  return rows[0] || null;
}

// ---------- Volunteer ----------
export type Volunteer = { name: string; member: string; group?: string; services?: string };
export async function getVolunteerByMember(member: string) {
  const rows = await listDocs<Volunteer>("Volunteer", { filters: { member }, limit: 1, fields: ["name","member","group","services"] });
  return rows[0] || null;
}
export async function createVolunteer(data: { member: string; group?: string; services?: string }) {
  const r = await api.post("/resource/Volunteer", data);
  return r.data.data as Volunteer;
}
export async function updateVolunteer(name: string, patch: Partial<Volunteer>) {
  const r = await api.put(`/resource/Volunteer/${encodeURIComponent(name)}`, patch);
  return r.data.data as Volunteer;
}
export async function deleteVolunteer(name: string) {
  await api.delete(`/resource/Volunteer/${encodeURIComponent(name)}`);
}

// ---------- Volunteer Group ----------
export type VolunteerGroup = { name: string; group_name: string; leader?: string; description?: string };
export async function listVolunteerGroups() {
  return listDocs<VolunteerGroup>("Volunteer Group", { fields: ["name","group_name","leader","description"], order_by: "group_name asc", limit: 200 });
}
export async function createVolunteerGroup(data: { group_name: string; leader?: string; description?: string }) {
  const r = await api.post("/resource/Volunteer%20Group", data);
  return r.data.data as VolunteerGroup;
}
export async function updateVolunteerGroup(name: string, patch: Partial<VolunteerGroup>) {
  const r = await api.put(`/resource/Volunteer%20Group/${encodeURIComponent(name)}`, patch);
  return r.data.data as VolunteerGroup;
}
export async function deleteVolunteerGroup(name: string) {
  await api.delete(`/resource/Volunteer%20Group/${encodeURIComponent(name)}`);
}

// ---------- ToDo feed for current user ----------
export type ToDoLite = { name: string; status?: string; date?: string; reference_type?: string; reference_name?: string; description?: string };
export async function listMyToDos(limit = 20) {
  const r = await api.get("/method/frappe.client.get_list", {
    params: {
      doctype: "ToDo",
      fields: JSON.stringify(["name","status","date","reference_type","reference_name","description"]),
      filters: JSON.stringify({ owner: undefined, status: "Open" }),
      limit_page_length: limit,
      order_by: "modified desc"
    },
    __skipAuthRedirect: true as any
  } as any);
  return (r.data.message || []) as ToDoLite[];
}

// List ToDos for specific user (by allocated_to); fallback to owner if server expects it
export async function listToDosFor(email: string, limit = 20) {
  const r = await api.get("/method/frappe.client.get_list", {
    params: {
      doctype: "ToDo",
      fields: JSON.stringify(["name","status","date","reference_type","reference_name","description"]),
      filters: JSON.stringify({ allocated_to: email, status: "Open" }),
      limit_page_length: limit,
      order_by: "modified desc"
    },
    __skipAuthRedirect: true as any
  } as any);
  return (r.data.message || []) as ToDoLite[];
}

// Create ToDo assigned to user
export async function createToDo(params: { allocated_to: string; description: string; reference_type?: string; reference_name?: string; status?: string }) {
  const payload = {
    doctype: "ToDo",
    allocated_to: params.allocated_to,
    description: params.description,
    reference_type: params.reference_type,
    reference_name: params.reference_name,
    status: params.status || "Open"
  } as any;
  const r = await api.post("/resource/ToDo", payload);
  return r.data;
}

// (removed duplicate interceptor)
