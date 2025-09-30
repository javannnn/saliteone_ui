import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import { ResponsiveContainer, LineChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from "recharts";

import { getPaymentsReport, PaymentsReportFilters, PaymentsReportResponse } from "@/lib/api";

const STATUS_OPTIONS = ["", "Paid", "Pending", "Failed"];
const METHOD_OPTIONS = ["", "Cash", "Debit", "Credit", "E-Transfer", "Other"];
const TYPE_OPTIONS = ["", "Tithe", "Donation", "Sponsorship", "Service Fee", "Other"];

const numberFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatCurrency(value: number) {
  return `$${numberFormatter.format(value || 0)}`;
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  );
}

export default function Reports() {
  const [form, setForm] = useState<PaymentsReportFilters>({ date_from: "", date_to: "", status: "", method: "", payment_type: "" });
  const [filters, setFilters] = useState<PaymentsReportFilters>({});

  const query = useQuery<PaymentsReportResponse>({
    queryKey: ["reports", "payments", filters],
    queryFn: () => getPaymentsReport(filters),
  });

  const summary = query.data?.summary;
  const breakdown = useMemo(() => ({
    status: query.data?.by_status ?? [],
    method: query.data?.by_method ?? [],
    type: query.data?.by_type ?? [],
  }), [query.data]);

  const trend = query.data?.trend ?? [];
  const rows = query.data?.rows ?? [];

  function updateField<K extends keyof PaymentsReportFilters>(key: K, value: PaymentsReportFilters[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    const next: PaymentsReportFilters = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        next[key as keyof PaymentsReportFilters] = value as any;
      }
    });
    setFilters(next);
  }

  function resetFilters() {
    setForm({ date_from: "", date_to: "", status: "", method: "", payment_type: "" });
    setFilters({});
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title="Payments Report" subheader="Filter and analyse payments by status, method, and type." />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <TextField
                label="From"
                type="date"
                value={form.date_from || ""}
                onChange={(e) => updateField("date_from", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                label="To"
                type="date"
                value={form.date_to || ""}
                onChange={(e) => updateField("date_to", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Select
                value={form.status || ""}
                onChange={(e) => updateField("status", e.target.value)}
                displayEmpty
                fullWidth
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt || "all"} value={opt}>{opt || "All Statuses"}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Select
                value={form.method || ""}
                onChange={(e) => updateField("method", e.target.value)}
                displayEmpty
                fullWidth
              >
                {METHOD_OPTIONS.map((opt) => (
                  <MenuItem key={opt || "all"} value={opt}>{opt || "All Methods"}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Select
                value={form.payment_type || ""}
                onChange={(e) => updateField("payment_type", e.target.value)}
                displayEmpty
                fullWidth
              >
                {TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt || "all"} value={opt}>{opt || "All Types"}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={12}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={applyFilters} disabled={query.isLoading}>Apply</Button>
                <Button variant="text" onClick={resetFilters}>Reset</Button>
              </Stack>
            </Grid>
          </Grid>
          {query.isFetching && <LinearProgress sx={{ mt: 2 }} />}
          {query.isError && <Alert severity="error" sx={{ mt: 2 }}>Failed to load payments report.</Alert>}
        </CardContent>
      </Card>

      {summary && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><SummaryCard title="Total Collected" value={formatCurrency(summary.total_amount)} subtitle={`${summary.count} payments`} /></Grid>
          <Grid item xs={12} md={3}><SummaryCard title="Paid" value={formatCurrency(summary.paid_amount)} /></Grid>
          <Grid item xs={12} md={3}><SummaryCard title="Pending" value={formatCurrency(summary.pending_amount)} /></Grid>
          <Grid item xs={12} md={3}><SummaryCard title="Failed" value={formatCurrency(summary.failed_amount)} /></Grid>
        </Grid>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: (t) => `1px solid ${t.palette.divider}`, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Amount by Status</Typography>
            {breakdown.status.length === 0 ? (
              <Typography color="text.secondary">No data for selected filters.</Typography>
            ) : (
              <Stack spacing={0.5}>
                {breakdown.status.map((item) => (
                  <Stack key={item.label} direction="row" justifyContent="space-between" sx={{ fontSize: 14 }}>
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.total_amount)} ({item.count})</span>
                  </Stack>
                ))}
              </Stack>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Amount by Method</Typography>
            {breakdown.method.length === 0 ? (
              <Typography color="text.secondary">No data for selected filters.</Typography>
            ) : (
              <Stack spacing={0.5}>
                {breakdown.method.map((item) => (
                  <Stack key={item.label} direction="row" justifyContent="space-between" sx={{ fontSize: 14 }}>
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.total_amount)} ({item.count})</span>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: (t) => `1px solid ${t.palette.divider}`, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Monthly Trend</Typography>
            {trend.length === 0 ? (
              <Typography color="text.secondary">No payments recorded for the selected period.</Typography>
            ) : (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="total_amount" stroke="#1976d2" name="Total" />
                    <Line type="monotone" dataKey="paid_amount" stroke="#2e7d32" name="Paid" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title="Payments" subheader="Latest transactions matching your filters." />
        <CardContent>
          {rows.length === 0 ? (
            <Typography color="text.secondary">No records found.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.name} hover>
                      <TableCell>{row.posting_date}</TableCell>
                      <TableCell>{row.member}</TableCell>
                      <TableCell>{formatCurrency(row.amount)}</TableCell>
                      <TableCell>{row.method}</TableCell>
                      <TableCell>{row.payment_type}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

