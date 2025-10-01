import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import { toast } from "sonner";

import FiltersBar from "@/components/ui/FiltersBar";
import DataTable, { Column } from "@/components/ui/DataTable";
import Spinner from "@/components/ui/spinner";
import {
  listSundaySchoolMembers,
  listSundaySchoolUploads,
  createSundaySchoolMember,
  updateSundaySchoolMember,
  recordSundaySchoolUpload,
  recordSundaySchoolContribution,
  getSundaySchoolSummary,
  SundaySchoolMemberRow,
  SundaySchoolUpload,
  SundaySchoolSummary,
} from "@/lib/api";

const categories = ["Child", "Youth", "Adult"];
const statuses = ["Active", "Inactive", "Graduated"];
const departments = [
  { id: "all", label: "All" },
  { id: "mezmur", label: "Mezmur" },
  { id: "education", label: "Education" },
  { id: "kinetebeb", label: "Kinetebeb" },
];
const contributionStatuses = ["Pending", "Paid", "Failed"];
const contributionMethods = ["Cash", "Debit", "Credit", "E-Transfer", "Other"];

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number | undefined | null) {
  return currencyFormatter.format(Number(value || 0));
}

type ContributionRow = { name: string; member: string; amount: number; status: string; posting_date: string };

export default function SundaySchool() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ category: "", status: "", q: "" });
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [selectedMember, setSelectedMember] = useState<SundaySchoolMemberRow | null>(null);
  const [deptTab, setDeptTab] = useState("all");
  const [uploadForm, setUploadForm] = useState({ member: "", title: "", description: "", department: "mezmur" });
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [contributionForm, setContributionForm] = useState({
    member: "",
    amount: "",
    status: "Pending",
    method: "Other",
    period: defaultPeriod,
    posting_date: "",
  });

  const membersQuery = useQuery({
    queryKey: ["sunday-school", "members", filters],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.q) params.q = filters.q;
      return listSundaySchoolMembers(params);
    },
  });

  const summaryQuery = useQuery<SundaySchoolSummary>({
    queryKey: ["sunday-school", "summary"],
    queryFn: () => getSundaySchoolSummary(),
  });

  const uploadsQuery = useQuery<SundaySchoolUpload[]>({
    queryKey: ["sunday-school", "uploads", deptTab],
    queryFn: () =>
      deptTab === "all"
        ? listSundaySchoolUploads()
        : listSundaySchoolUploads({ department: deptTab }),
  });

  const createMemberMutation = useMutation({
    mutationFn: createSundaySchoolMember,
    onSuccess: () => {
      toast.success("Sunday School member enrolled");
      qc.invalidateQueries({ queryKey: ["sunday-school", "members"] });
      qc.invalidateQueries({ queryKey: ["sunday-school", "summary"] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to enroll member"),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ name, patch }: { name: string; patch: Record<string, any> }) =>
      updateSundaySchoolMember(name, patch),
    onSuccess: () => {
      toast.success("Member updated");
      qc.invalidateQueries({ queryKey: ["sunday-school", "members"] });
      qc.invalidateQueries({ queryKey: ["sunday-school", "summary"] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update member"),
  });

  const uploadMutation = useMutation({
    mutationFn: recordSundaySchoolUpload,
    onSuccess: () => {
      toast.success("Upload recorded");
      qc.invalidateQueries({ queryKey: ["sunday-school", "uploads"] });
      qc.invalidateQueries({ queryKey: ["sunday-school", "summary"] });
      setUploadForm({ member: "", title: "", description: "", department: uploadForm.department });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to record upload"),
  });

  const contributionMutation = useMutation({
    mutationFn: recordSundaySchoolContribution,
    onSuccess: () => {
      toast.success("Contribution recorded");
      qc.invalidateQueries({ queryKey: ["sunday-school", "summary"] });
      setContributionForm({
        member: "",
        amount: "",
        status: contributionForm.status,
        method: contributionForm.method,
        period: contributionForm.period || defaultPeriod,
        posting_date: "",
      });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to record contribution"),
  });

  const members = membersQuery.data || [];
  const summary = summaryQuery.data;
  const uploads = uploadsQuery.data || [];

  const participationLeaders = useMemo(() => summary?.participation ?? [], [summary]);

  const categoryBreakdown = useMemo(() => summary?.by_category ?? [], [summary]);

  function openCreateDialog() {
    setSelectedMember(null);
    setForm({ member: "", category: "Child", status: "Active", monthly_payment: "", notes: "" });
    setDialogMode("create");
  }

  function openEditDialog(row: SundaySchoolMemberRow) {
    setSelectedMember(row);
    setForm({
      member: row.member,
      category: row.category,
      status: row.status,
      monthly_payment: row.monthly_payment ?? "",
      notes: row.notes || "",
      enrollment_date: row.enrollment_date || "",
    });
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setForm({});
    setSelectedMember(null);
  }

  function submitDialog() {
    if (dialogMode === "create") {
      const payload = {
        member: (form.member || "").trim(),
        category: form.category || "Child",
        monthly_payment: form.monthly_payment === "" ? undefined : Number(form.monthly_payment),
        notes: form.notes || undefined,
      };
      if (!payload.member) {
        toast.error("Member ID is required");
        return;
      }
      createMemberMutation.mutate(payload);
    } else if (dialogMode === "edit" && selectedMember) {
      const patch: Record<string, any> = {
        category: form.category,
        status: form.status,
        notes: form.notes || undefined,
      };
      if (form.monthly_payment === "") {
        patch.monthly_payment = 0;
      } else {
        patch.monthly_payment = Number(form.monthly_payment);
      }
      if (form.enrollment_date) {
        patch.enrollment_date = form.enrollment_date;
      }
      updateMemberMutation.mutate({ name: selectedMember.name, patch });
    }
  }

  function submitUpload() {
    const payload = {
      member: (uploadForm.member || "").trim(),
      department: uploadForm.department || deptTab,
      title: uploadForm.title,
      description: uploadForm.description || undefined,
    };
    if (!payload.member || !payload.title) {
      toast.error("Member and title are required");
      return;
    }
    uploadMutation.mutate(payload);
  }

  function submitContribution() {
    const amount = Number(contributionForm.amount || 0);
    if (!contributionForm.member || !amount) {
      toast.error("Member and amount are required");
      return;
    }
    contributionMutation.mutate({
      member: contributionForm.member.trim(),
      amount,
      status: contributionForm.status,
      method: contributionForm.method,
      period: contributionForm.period,
      posting_date: contributionForm.posting_date || undefined,
    });
  }

  const memberColumns = useMemo<Column<SundaySchoolMemberRow>[]>(() => ([
    { id: "member", label: "Member" },
    { id: "full_name", label: "Name" },
    { id: "category", label: "Category" },
    { id: "status", label: "Status" },
    { id: "monthly_payment", label: "Monthly", render: (row: SundaySchoolMemberRow) => formatCurrency(row.monthly_payment), align: "right" as const },
    { id: "mezmur_uploads", label: "Mezmur", align: "right" as const },
    { id: "education_posts", label: "Education", align: "right" as const },
    { id: "kinetebeb_docs", label: "Kinetebeb", align: "right" as const },
    {
      id: "actions",
      label: "Actions",
      render: (row) => (
        <Button size="small" onClick={(e) => { e.stopPropagation(); openEditDialog(row); }}>
          Edit
        </Button>
      ),
      sortable: false,
      align: "right" as const,
    },
  ]), []);

  const uploadColumns = useMemo<Column<SundaySchoolUpload>[]>(() => ([
    { id: "modified", label: "Updated" },
    { id: "title", label: "Title" },
    { id: "requester", label: "Member" },
    { id: "department", label: "Department" },
    { id: "status", label: "Status" },
  ]), []);

  const contributionRows = useMemo<ContributionRow[]>(
    () =>
      (summary?.payments?.rows ?? []).map((row) => ({
        name: row.name,
        member: row.member,
        amount: Number(row.amount || 0),
        status: row.status,
        posting_date: row.posting_date,
      })),
    [summary],
  );

  const contributionColumns = useMemo<Column<ContributionRow>[]>(() => ([
    { id: "posting_date", label: "Date" },
    { id: "member", label: "Member" },
    { id: "amount", label: "Amount", render: (row) => formatCurrency(row.amount), align: "right" as const },
    { id: "status", label: "Status" },
  ]), []);

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Sunday School Module</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Total Members</Typography>
              <Typography variant="h5">{summary?.totals.members ?? "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Active Members</Typography>
              <Typography variant="h5">{summary?.totals.active_members ?? "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Monthly Commitment</Typography>
              <Typography variant="h5">{formatCurrency(summary?.totals.monthly_commitment)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Paid Contributions</Typography>
              <Typography variant="h5">{formatCurrency(summary?.payments?.paid_total)}</Typography>
              <Typography variant="caption" color="text.secondary">Pending: {formatCurrency(summary?.payments?.pending_total)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Categories" subheader="Enrollment breakdown" />
            <CardContent>
              {categoryBreakdown.length === 0 && <Typography color="text.secondary">No data.</Typography>}
              <Stack spacing={1}>
                {categoryBreakdown.map((item) => (
                  <Stack direction="row" justifyContent="space-between" key={item.category}>
                    <span>{item.category}</span>
                    <Chip label={item.count} size="small" />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Participation" subheader="Top contributors" />
            <CardContent>
              {participationLeaders.length === 0 && <Typography color="text.secondary">No activity yet.</Typography>}
              <Stack spacing={1}>
                {participationLeaders.map((item) => (
                  <Stack direction="row" justifyContent="space-between" key={item.name}>
                    <span>{item.name}</span>
                    <Chip label={item.score} size="small" color="primary" />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Uploads" subheader="By department" />
            <CardContent>
              {(summary?.uploads?.by_department ?? []).length === 0 && <Typography color="text.secondary">No uploads recorded.</Typography>}
              <Stack spacing={1}>
                {(summary?.uploads?.by_department ?? []).map((item) => (
                  <Stack direction="row" justifyContent="space-between" key={item.department}>
                    <span>{item.department}</span>
                    <Chip label={item.count} size="small" color="secondary" />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title="Enrollment"
          action={<Button variant="contained" onClick={openCreateDialog}>Enroll member</Button>}
        />
        <CardContent>
          <Stack spacing={2}>
            <FiltersBar
              onReset={() => setFilters({ category: "", status: "", q: "" })}
            >
              <TextField
                size="small"
                label="Search"
                value={filters.q}
                onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                placeholder="Name or ID"
              />
              <TextField
                size="small"
                select
                label="Category"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All</MenuItem>
                {statuses.map((st) => (
                  <MenuItem key={st} value={st}>{st}</MenuItem>
                ))}
              </TextField>
            </FiltersBar>
            {membersQuery.isLoading ? (
              <Stack direction="row" spacing={1} alignItems="center"><Spinner /> <span>Loading members…</span></Stack>
            ) : (
              <DataTable<SundaySchoolMemberRow> columns={memberColumns} rows={members} initialSort={{ by: "member", dir: "asc" }} />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Department Uploads" subheader="Track lessons, poems, and coursework" />
            <CardContent>
              <Tabs
                value={deptTab}
                onChange={(_, value) => setDeptTab(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                {departments.map((tab) => (
                  <Tab key={tab.id} value={tab.id} label={tab.label} />
                ))}
              </Tabs>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    size="small"
                    label="Member"
                    value={uploadForm.member}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, member: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="Title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    select
                    label="Department"
                    value={uploadForm.department}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, department: e.target.value }))}
                    sx={{ minWidth: 160 }}
                  >
                    {departments.filter((d) => d.id !== "all").map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>{dept.label}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <TextField
                  size="small"
                  label="Description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                />
                <Box>
                  <Button
                    variant="contained"
                    onClick={submitUpload}
                    disabled={uploadMutation.isPending}
                  >
                    Record upload
                  </Button>
                </Box>
                <Divider />
                {uploadsQuery.isLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center"><Spinner /> <span>Loading uploads…</span></Stack>
                ) : (
                  <DataTable<SundaySchoolUpload> columns={uploadColumns} rows={uploads} initialSort={{ by: "modified", dir: "desc" }} pageSize={5} />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Monthly Contributions" subheader="Track Sunday School fees" />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    size="small"
                    label="Member"
                    value={contributionForm.member}
                    onChange={(e) => setContributionForm((prev) => ({ ...prev, member: e.target.value }))}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Amount"
                    type="number"
                    value={contributionForm.amount}
                    onChange={(e) => setContributionForm((prev) => ({ ...prev, amount: e.target.value }))}
                    sx={{ width: 140 }}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    size="small"
                    select
                    label="Status"
                    value={contributionForm.status}
                    onChange={(e) => setContributionForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {contributionStatuses.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    select
                    label="Method"
                    value={contributionForm.method}
                    onChange={(e) => setContributionForm((prev) => ({ ...prev, method: e.target.value }))}
                  >
                    {contributionMethods.map((method) => (
                      <MenuItem key={method} value={method}>{method}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Period"
                    type="month"
                    value={contributionForm.period}
                    onChange={(e) => setContributionForm((prev) => ({ ...prev, period: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="Posting Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={contributionForm.posting_date}
                    onChange={(e) => setContributionForm((prev) => ({ ...prev, posting_date: e.target.value }))}
                  />
                </Stack>
                <Box>
                  <Button variant="contained" onClick={submitContribution} disabled={contributionMutation.isPending}>
                    Record contribution
                  </Button>
                </Box>
                <Divider />
                <Typography variant="subtitle2">Recent contributions</Typography>
                {summaryQuery.isLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center"><Spinner /> <span>Loading contributions…</span></Stack>
                ) : contributionRows.length === 0 ? (
                  <Typography color="text.secondary">No contributions yet.</Typography>
                ) : (
                  <DataTable<ContributionRow>
                    columns={contributionColumns}
                    rows={contributionRows}
                    initialSort={{ by: "posting_date", dir: "desc" }}
                    pageSize={5}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === "create" ? "Enroll Sunday School member" : "Edit Sunday School member"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Member ID"
              value={form.member || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, member: e.target.value }))}
              disabled={dialogMode === "edit"}
              helperText="Use the Member document name"
            />
            <TextField
              select
              label="Category"
              value={form.category || "Child"}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={form.status || "Active"}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {statuses.map((st) => (
                <MenuItem key={st} value={st}>{st}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Monthly Contribution"
              type="number"
              value={form.monthly_payment ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, monthly_payment: e.target.value }))}
            />
            <TextField
              label="Enrollment Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.enrollment_date || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, enrollment_date: e.target.value }))}
            />
            <TextField
              label="Notes"
              value={form.notes || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitDialog}
            disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
          >
            {dialogMode === "create" ? "Enroll" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
