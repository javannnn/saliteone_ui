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
  const r = await api.get("/method/ping", { [SKIP_REDIRECT_KEY]: true } as any);
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
  async (err) => {
    const s = err?.response?.status;
    if (!err?.response) {
      toast.error("Network error");
      return Promise.reject(err);
    }
    const skip = err?.config && (err.config as any)[SKIP_REDIRECT_KEY];
    // Never nuke auth on 403 — show a gentle message instead
    if (s === 403) {
      if (!skip) toast.error("Insufficient permissions");
      return Promise.reject(err);
    }
    // Only redirect on confirmed expired session (401 + whoami says Guest)
    const method = (err?.config?.method || '').toLowerCase();
    if (s === 401 && !skip && method !== 'get') {
      try {
        const me = await api.get("/method/salitemiret.api.auth.whoami", { [SKIP_REDIRECT_KEY]: true } as any);
        const msg = me?.data?.message ?? me?.data;
        if (!msg || msg.user === "Guest") {
          try { localStorage.removeItem("auth"); } catch {}
          if (window.location.pathname !== "/") window.location.href = "/";
        }
      } catch {
        // If whoami fails, be conservative and don't force logout immediately.
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
  const r = await api.get("/method/salitemiret.api.auth.has_doctype_permission", { params: { doctype, ptype }, __skipAuthRedirect: true } as any);
  const msg = r.data?.message ?? r.data;
  return !!msg;
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
export type MemberRow = { name: string; first_name: string; last_name: string; phone: string; status: string;};
export async function listMembers() {
  const dt = encodeURIComponent("Member");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","first_name","last_name","phone","status"]', limit_page_length: 30 }
  });
  return r.data.data as MemberRow[];
}

// Admin helper: create member (reuses volunteer API for member creation)
export async function adminCreateMember(payload: { first_name: string; last_name: string; email: string; phone?: string; status?: string }) {
  const r = await api.post("/method/salitemiret.api.volunteer.create_member", payload as any);
  return r.data?.message ?? r.data;
}

export type PaymentRow = {
  name: string;
  member: string;
  amount: number;
  status: string;
  payment_type?: string;
  method?: string;
  posting_date?: string;
  gateway?: string;
  gateway_reference?: string;
};
export async function listPayments() {
  const dt = encodeURIComponent("Payment");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","member","amount","status","payment_type","method","posting_date","gateway","gateway_reference"]', limit_page_length: 20, order_by: "posting_date desc" }
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

export type MediaRequestRow = { name: string; title: string; status: string; requester?: string; modified?: string };
export async function listMediaRequests() {
  const dt = encodeURIComponent("Media Request");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","title","status","requester","modified"]', limit_page_length: 20 }
  });
  return r.data.data as MediaRequestRow[];
}

// Create Media Request (generic resource create)
export async function createMediaRequest(payload: { requester?: string; title: string; description?: string; status?: string }) {
  const r = await api.post("/resource/Media%20Request", payload as any);
  return r.data?.data || (r.data?.message ?? r.data);
}

export type SchoolEnrollmentRow = { name: string; member?: string; child_name?: string; school_type: string };
export async function listSchoolEnrollments() {
  const dt = encodeURIComponent("School Enrollment");
  const r = await api.get(`/resource/${dt}`, {
    params: { fields: '["name","member","child_name","school_type"]', limit_page_length: 20 }
  });
  return r.data.data as SchoolEnrollmentRow[];
}

// ---------- Sunday School ----------
export type SundaySchoolMemberRow = {
  name: string;
  member: string;
  full_name?: string;
  email?: string;
  phone?: string;
  category: string;
  status: string;
  enrollment_date?: string;
  monthly_payment: number;
  mezmur_uploads: number;
  education_posts: number;
  kinetebeb_docs: number;
  notes?: string;
  last_reminder_on?: string;
};

export async function listSundaySchoolMembers(params: { category?: string; status?: string; q?: string } = {}) {
  const r = await api.get("/method/salitemiret.api.sunday_school.list_members", { params, __skipAuthRedirect: true } as any);
  return (r.data?.message ?? r.data) as SundaySchoolMemberRow[];
}

export async function createSundaySchoolMember(payload: { member: string; category: string; monthly_payment?: number; notes?: string }) {
  const r = await api.post("/method/salitemiret.api.sunday_school.create_member", payload as any);
  return (r.data?.message ?? r.data) as SundaySchoolMemberRow;
}

export async function updateSundaySchoolMember(name: string, patch: Partial<{ category: string; status: string; monthly_payment: number; notes: string; enrollment_date: string }>) {
  const r = await api.post("/method/salitemiret.api.sunday_school.update_member", { name, patch } as any);
  return (r.data?.message ?? r.data) as SundaySchoolMemberRow;
}

export type SundaySchoolUpload = { name: string; title: string; status: string; department: string; requester: string; modified: string; sunday_school_member?: string };
export async function listSundaySchoolUploads(params: { department?: string; member?: string; status?: string } = {}) {
  const r = await api.get("/method/salitemiret.api.sunday_school.list_department_uploads", { params, __skipAuthRedirect: true } as any);
  return (r.data?.message ?? r.data) as SundaySchoolUpload[];
}

export async function recordSundaySchoolUpload(payload: { member: string; department: string; title: string; description?: string }) {
  const r = await api.post("/method/salitemiret.api.sunday_school.record_department_upload", payload as any);
  return (r.data?.message ?? r.data) as SundaySchoolUpload;
}

export async function recordSundaySchoolContribution(payload: { member: string; amount: number; status?: string; method?: string; posting_date?: string; period?: string }) {
  const r = await api.post("/method/salitemiret.api.sunday_school.record_monthly_contribution", payload as any);
  return (r.data?.message ?? r.data) as { name: string; member: string; amount: number; status: string; posting_date: string; gateway_reference?: string };
}

export type SundaySchoolSummary = {
  totals: { members: number; active_members: number; monthly_commitment: number };
  by_category: Array<{ category: string; count: number }>;
  payments: { rows: Array<{ name: string; member: string; amount: number; status: string; posting_date: string }>; paid_total: number; pending_total: number };
  uploads: { rows: SundaySchoolUpload[]; by_department: Array<{ department: string; count: number }> };
  participation: Array<{ name: string; category?: string; score: number }>;
};

export async function getSundaySchoolSummary(params: { date_from?: string; date_to?: string } = {}) {
  const r = await api.get("/method/salitemiret.api.sunday_school.summary", { params, __skipAuthRedirect: true } as any);
  return (r.data?.message ?? r.data) as SundaySchoolSummary;
}

// ---------- Generic list ----------
export async function listDocs<T = any>(doctype: string, opts: {
  fields?: string[]; filters?: Record<string, any>; order_by?: string; limit?: number; start?: number
} = {}) {
  const r = await api.get(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      ...(opts.fields ? { fields: JSON.stringify(opts.fields) } : {}),
      ...(opts.filters ? { filters: JSON.stringify(opts.filters) } : {}),
      ...(opts.order_by ? { order_by: opts.order_by } : {}),
      ...(opts.limit ? { limit_page_length: opts.limit } : {}),
      ...(opts.start ? { limit_start: opts.start } : {}),
    }
  });
  return r.data.data as T[];
}

// ---------- Member lookup by email ----------
export async function getMemberByEmail(email: string) {
  const r = await api.get("/method/salitemiret.api.volunteer.get_member_by_email", { params: { email }, __skipAuthRedirect: true } as any);
  const msg = r.data?.message ?? r.data;
  return msg || null;
}

// ---------- Volunteer ----------
export type Volunteer = { name: string; member: string; group?: string; services?: string };
export async function getVolunteerByMember(member: string) {
  const r = await api.get("/method/salitemiret.api.volunteer.get_volunteer_by_member", { params: { member }, __skipAuthRedirect: true } as any);
  return (r.data?.message ?? r.data) || null;
}
export async function createVolunteer(data: { member: string; group?: string; services?: string }) {
  const r = await api.post("/method/salitemiret.api.volunteer.create_volunteer", data as any);
  return (r.data?.message ?? r.data) as any as Volunteer;
}
export async function updateVolunteer(name: string, patch: Partial<Volunteer>) {
  const r = await api.post("/method/salitemiret.api.volunteer.update_volunteer", { name, patch } as any);
  return (r.data?.message ?? r.data) as any as Volunteer;
}
export async function deleteVolunteer(name: string) {
  await api.post("/method/salitemiret.api.volunteer.delete_volunteer", { name } as any);
}

// ---------- Volunteer Group ----------
export type VolunteerGroup = { name: string; group_name: string; leader?: string; description?: string };
export async function listVolunteerGroups() {
  const r = await api.get("/method/salitemiret.api.volunteer.list_groups", { __skipAuthRedirect: true } as any);
  const rows = (r.data?.message ?? r.data) as VolunteerGroup[];
  return rows.map((row) => ({
    name: row.name,
    group_name: row.group_name,
    leader: row.leader,
    description: row.description,
  }));
}
export async function createVolunteerGroup(data: { group_name: string; leader?: string; description?: string }) {
  const r = await api.post("/method/salitemiret.api.volunteer.create_group", data as any);
  return (r.data?.message ?? r.data) as VolunteerGroup;
}
export async function updateVolunteerGroup(name: string, patch: Partial<VolunteerGroup>) {
  const r = await api.post("/method/salitemiret.api.volunteer.update_group", { name, patch } as any);
  return (r.data?.message ?? r.data) as VolunteerGroup;
}
export async function deleteVolunteerGroup(name: string) {
  await api.post("/method/salitemiret.api.volunteer.delete_group", { name } as any);
}
export async function ensureMemberForEmail(email: string) {
  const r = await api.post("/method/salitemiret.api.volunteer.ensure_member_for_email", { email } as any);
  return (r.data?.message ?? r.data) as { member: string };
}
export async function promoteVolunteerToMember(volunteer: string, email?: string) {
  const r = await api.post("/method/salitemiret.api.volunteer.promote_volunteer_to_member", { volunteer, email } as any);
  return (r.data?.message ?? r.data) as { member: string; created: boolean };
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
  const r = await api.get("/method/salitemiret.api.volunteer.list_todos_for", { params: { email, limit }, __skipAuthRedirect: true } as any);
  return ((r.data?.message ?? r.data) || []) as ToDoLite[];
}

// Create ToDo assigned to user
export async function createToDo(params: { allocated_to: string; description: string; reference_type?: string; reference_name?: string; status?: string }) {
  const r = await api.post("/method/salitemiret.api.volunteer.create_todo", params as any);
  return (r.data?.message ?? r.data);
}

export async function updateToDo(name: string, status: string = "Closed") {
  const r = await api.post("/method/salitemiret.api.volunteer.update_todo", { name, status } as any);
  return (r.data?.message ?? r.data);
}

export async function listWorkflowHistory(member_email?: string, limit = 50) {
  const r = await api.get("/method/salitemiret.api.volunteer.list_workflow_history", { params: { member_email, limit }, __skipAuthRedirect: true } as any);
  return (r.data?.message ?? r.data) as Array<{ name:string; workflow_process?:string; from_step?:string; to_step?:string; actor?:string; modified?:string }>;
}

export async function createMember(data: { first_name: string; last_name: string; email: string; phone?: string }) {
  const r = await api.post("/method/salitemiret.api.volunteer.create_member", data as any);
  return (r.data?.message ?? r.data) as { name: string };
}

export type EnsureSystemUserResponse = { user: string; temp_password?: string; created?: boolean };

export async function ensureSystemUserForMember(member: string, roles?: string[]): Promise<EnsureSystemUserResponse> {
  try {
    const r = await api.post("/method/salitemiret.api.auth.ensure_system_user_for_member", { member, roles } as any);
    return (r.data?.message ?? r.data) as EnsureSystemUserResponse;
  } catch (e: any) {
    if (e?.response?.status === 404) {
      const r2 = await api.post("/method/salitemiret.api.admin.ensure_system_user_for_member", { member, roles } as any);
      return (r2.data?.message ?? r2.data) as EnsureSystemUserResponse;
    }
    throw e;
  }
}

// --------- Member self-service ---------
export async function getMyMember() {
  const r = await api.get("/method/salitemiret.api.member.my_member", { __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function updateMyMember(patch: any) {
  const r = await api.post("/method/salitemiret.api.member.update_my_member", { patch } as any);
  return r.data?.message ?? r.data;
}
export async function listMyPayments(limit = 50, date_from?: string, date_to?: string, method?: string, status?: string) {
  const r = await api.get("/method/salitemiret.api.member.list_my_payments", { params: { limit, date_from, date_to, method, status }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listMySponsorships(limit = 50) {
  const r = await api.get("/method/salitemiret.api.member.list_my_sponsorships", { params: { limit }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}

// Family
export async function listMyFamily(member_name?: string) {
  const r = await api.get("/method/salitemiret.api.member.list_my_family", { params: { member_name }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function upsertFamilyMember(child: any) {
  const r = await api.post("/method/salitemiret.api.member.upsert_family_member", { child } as any);
  return r.data?.message ?? r.data;
}
export async function deleteFamilyMember(rowname: string) {
  const r = await api.post("/method/salitemiret.api.member.delete_family_member", { rowname } as any);
  return r.data?.message ?? r.data;
}

// Status & Tithe
export async function getMyStatus() {
  const r = await api.get("/method/salitemiret.api.member.get_my_status", { __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function setMyTitheCommitment(payload: { committed: boolean; monthly_amount?: number; method?: string }) {
  const r = await api.post("/method/salitemiret.api.member.set_my_tithe_commitment", { committed: payload.committed ? 1 : 0, monthly_amount: payload.monthly_amount, method: payload.method } as any);
  return r.data?.message ?? r.data;
}
export async function getMyTitheSummary() {
  const r = await api.get("/method/salitemiret.api.member.get_my_tithe_summary", { __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listMyTitheContributions(limit = 12) {
  const r = await api.get("/method/salitemiret.api.member.list_my_tithe_contributions", { params: { limit }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function titheOverview(period?: string) {
  const r = await api.get("/method/salitemiret.api.tithe.tithe_overview", { params: { period }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listTitheCommitments(params: { status?: string; member?: string } = {}) {
  const r = await api.get("/method/salitemiret.api.tithe.list_tithe_commitments", { params, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function saveTitheCommitment(payload: any) {
  const r = await api.post("/method/salitemiret.api.tithe.upsert_tithe_commitment", payload as any);
  return r.data?.message ?? r.data;
}
export async function listTitheContributions(params: { member?: string; status?: string; limit?: number; start?: number } = {}) {
  const r = await api.get("/method/salitemiret.api.tithe.list_tithe_contributions", { params, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function saveTitheContribution(payload: any) {
  const r = await api.post("/method/salitemiret.api.tithe.upsert_tithe_contribution", payload as any);
  return r.data?.message ?? r.data;
}
export async function deleteTitheContribution(name: string) {
  const r = await api.post("/method/salitemiret.api.tithe.delete_tithe_contribution", { name } as any);
  return r.data?.message ?? r.data;
}
export type PaymentGateway = {
  key: string;
  label: string;
  configured: boolean;
  active: boolean;
  brand_color: string;
  logo: string;
  description: string;
  supports_wallets: boolean;
  requires_configuration: boolean;
};
export type PaymentIntentResponse = {
  status: string;
  provider?: string;
  message?: string;
  payment_id?: string;
  checkout_url?: string | null;
  requires_action?: boolean;
};
export async function listPaymentGateways() {
  const r = await api.get("/method/salitemiret.api.payments.list_payment_gateways", { __skipAuthRedirect: true } as any);
  return (r.data?.message ?? r.data) as PaymentGateway[];
}
export async function initiatePayment(payload: { provider: string; amount: number; member: string; currency?: string; commitment?: string | null; metadata?: Record<string, unknown> }) {
  const r = await api.post("/method/salitemiret.api.payments.initiate_payment", payload as any);
  const message = r.data?.message ?? r.data;
  return message as PaymentIntentResponse;
}
export async function listMyNotifications(limit = 20) {
  const r = await api.get("/method/salitemiret.api.member.list_my_notifications", { params: { limit }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function markNotificationRead(name: string) {
  const r = await api.post("/method/salitemiret.api.member.mark_notification_read", { name } as any);
  return r.data?.message ?? r.data;
}
export async function markAllNotificationsRead() {
  const r = await api.post("/method/salitemiret.api.member.mark_all_notifications_read", {} as any);
  return r.data?.message ?? r.data;
}

// Volunteer Service Logs
export async function createServiceLog(payload: any) {
  const r = await api.post("/method/salitemiret.api.volunteer.create_service_log", { payload } as any);
  return r.data?.message ?? r.data;
}
export async function listMyServiceLogs(limit = 50) {
  const r = await api.get("/method/salitemiret.api.volunteer.list_my_service_logs", { params: { limit }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function updateServiceLog(name: string, payload: any) {
  const r = await api.post("/method/salitemiret.api.volunteer.update_service_log", { name, payload } as any);
  return r.data?.message ?? r.data;
}
export async function serviceStats(opts: { volunteer?: string; group?: string; months?: number } = {}) {
  const r = await api.get("/method/salitemiret.api.volunteer.service_stats", { params: opts as any, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listGroupServiceLogs(group: string, limit = 100, start = 0) {
  const r = await api.get("/method/salitemiret.api.volunteer.list_group_service_logs", { params: { group, limit, start }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listGroupToDos(group: string, status: string = "Open", limit = 200, start = 0) {
  const r = await api.get("/method/salitemiret.api.volunteer.list_group_todos", { params: { group, status, limit, start }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function approveServiceLog(name: string) {
  const r = await api.post("/method/salitemiret.api.volunteer.approve_service_log", { name } as any);
  return r.data?.message ?? r.data;
}
export async function rejectServiceLog(name: string, reason?: string) {
  const r = await api.post("/method/salitemiret.api.volunteer.reject_service_log", { name, reason } as any);
  return r.data?.message ?? r.data;
}

// Admin dashboard
export async function getAdminDashboardCounts() {
  const r = await api.get("/method/salitemiret.api.admin.admin_dashboard_counts", { __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}

// Team Leader helpers
export async function listGroupMembers(group: string) {
  const r = await api.get("/method/salitemiret.api.volunteer.list_group_members", { params: { group }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function assignTodoToVolunteer(volunteer: string, subject: string, due_date?: string) {
  const r = await api.post("/method/salitemiret.api.volunteer.assign_todo_to_volunteer", { volunteer, subject, due_date } as any);
  return r.data?.message ?? r.data;
}
export async function groupReport(group: string, date_from?: string, date_to?: string) {
  const r = await api.get("/method/salitemiret.api.volunteer.group_report", { params: { group, date_from, date_to }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}

// Approvals
export async function listPendingMembers(limit=50, start=0) {
  const r = await api.get("/method/salitemiret.api.approvals.list_pending_members", { params: { limit, start }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listPendingMediaRequests(limit=50, start=0) {
  const r = await api.get("/method/salitemiret.api.approvals.list_pending_media_requests", { params: { limit, start }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function listSubmittedServiceLogs(limit=50, start=0) {
  const r = await api.get("/method/salitemiret.api.approvals.list_submitted_service_logs", { params: { limit, start }, __skipAuthRedirect: true } as any);
  return r.data?.message ?? r.data;
}
export async function adminSetMemberStatus(name: string, status: string) {
  const r = await api.post("/method/salitemiret.api.approvals.admin_set_member_status", { name, status } as any);
  return r.data?.message ?? r.data;
}

// Reports
export type PaymentsReportFilters = {
  date_from?: string;
  date_to?: string;
  status?: string;
  method?: string;
  payment_type?: string;
  member?: string;
  limit?: number;
};

export type PaymentsReportBreakdown = { label: string; count: number; total_amount: number };
export type PaymentsTrendRow = { period: string; total_amount: number; paid_amount: number };
export type PaymentsReportRow = {
  name: string;
  member: string;
  amount: number;
  method: string;
  payment_type: string;
  status: string;
  posting_date: string;
};

export type PaymentsReportResponse = {
  summary: { count: number; total_amount: number; paid_amount: number; pending_amount: number; failed_amount: number };
  by_status: PaymentsReportBreakdown[];
  by_method: PaymentsReportBreakdown[];
  by_type: PaymentsReportBreakdown[];
  trend: PaymentsTrendRow[];
  rows: PaymentsReportRow[];
};

export async function getPaymentsReport(filters: PaymentsReportFilters = {}): Promise<PaymentsReportResponse> {
  const params: Record<string, string | number> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params[key] = value as any;
  });
  const r = await api.get("/method/salitemiret.api.reports.payments_report", {
    params,
    [SKIP_REDIRECT_KEY]: true,
  } as any);
  return (r.data?.message ?? r.data) as PaymentsReportResponse;
}

// Public: request volunteer onboarding
export async function requestVolunteer(input: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  skills?: string;
}) {
  const r = await api.post("/method/salitemiret.api.public.request_volunteer", input);
  return r.data?.message ?? r.data;
}

// (removed duplicate interceptor)
