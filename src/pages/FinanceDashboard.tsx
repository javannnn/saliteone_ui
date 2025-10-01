import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  titheOverview,
  listTitheCommitments,
  listTitheContributions,
  saveTitheContribution,
  deleteTitheContribution,
  saveTitheCommitment,
  listDocs,
  listPaymentGateways,
  type PaymentGateway,
} from "@/lib/api";

const paymentMethods = ["Cash", "Debit", "Credit", "E-Transfer", "Other"] as const;
const contributionStatuses = ["Paid", "Pending", "Missed", "Written Off"] as const;
const commitmentStatuses = ["Active", "Paused", "Ended"] as const;
const frequencies = ["Monthly", "Quarterly", "Annual"] as const;

export default function FinanceDashboard() {
  const qc = useQueryClient();
  const overviewQ = useQuery({ queryKey: ["tithe-overview"], queryFn: () => titheOverview() });
  const commitmentsQ = useQuery({ queryKey: ["tithe-commitments"], queryFn: () => listTitheCommitments() });
  const contributionsQ = useQuery({ queryKey: ["tithe-contributions"], queryFn: () => listTitheContributions({ limit: 25 }) });
  const membersQ = useQuery({
    queryKey: ["members-lite"],
    queryFn: () => listDocs<any>("Member", {
      fields: ["name", "first_name", "last_name", "status"],
      limit: 200,
      order_by: "first_name asc",
    }),
  });
  const gatewaysQ = useQuery<PaymentGateway[]>({ queryKey: ["payment-gateways-admin"], queryFn: listPaymentGateways });

  const [contributionForm, setContributionForm] = useState({
    open: false,
    name: "",
    member: "",
    month: "",
    amount: "",
    method: paymentMethods[0],
    status: contributionStatuses[0],
    create_payment: true,
  });

  const [commitmentForm, setCommitmentForm] = useState({
    open: false,
    name: "",
    member: "",
    committed: true,
    monthly_amount: "",
    method: paymentMethods[0],
    frequency: frequencies[0],
    status: commitmentStatuses[0],
    activation_threshold: 2,
    lapse_threshold: 2,
    grace_period_days: 10,
  });

  const saveContribution = useMutation({
    mutationFn: (payload: any) => saveTitheContribution(payload),
    onSuccess: () => {
      toast.success("Contribution saved");
      qc.invalidateQueries({ queryKey: ["tithe-contributions"] });
      qc.invalidateQueries({ queryKey: ["tithe-overview"] });
    },
    onError: () => toast.error("Failed to save contribution"),
  });

  const removeContribution = useMutation({
    mutationFn: (name: string) => deleteTitheContribution(name),
    onSuccess: () => {
      toast.success("Contribution removed");
      qc.invalidateQueries({ queryKey: ["tithe-contributions"] });
      qc.invalidateQueries({ queryKey: ["tithe-overview"] });
    },
    onError: () => toast.error("Unable to delete contribution"),
  });

  const saveCommitment = useMutation({
    mutationFn: (payload: any) => saveTitheCommitment(payload),
    onSuccess: () => {
      toast.success("Commitment saved");
      qc.invalidateQueries({ queryKey: ["tithe-commitments"] });
      qc.invalidateQueries({ queryKey: ["tithe-overview"] });
    },
    onError: () => toast.error("Failed to save commitment"),
  });

  const overview = overviewQ.data || {};
  const commitments = commitmentsQ.data || [];
  const contributions = contributionsQ.data || [];
  const members = membersQ.data || [];
  const gateways = gatewaysQ.data || [];

  const resetContributionForm = () =>
    setContributionForm({
      open: false,
      name: "",
      member: "",
      month: "",
      amount: "",
      method: paymentMethods[0],
      status: contributionStatuses[0],
      create_payment: true,
    });

  const resetCommitmentForm = () =>
    setCommitmentForm({
      open: false,
      name: "",
      member: "",
      committed: true,
      monthly_amount: "",
      method: paymentMethods[0],
      frequency: frequencies[0],
      status: commitmentStatuses[0],
      activation_threshold: 2,
      lapse_threshold: 2,
      grace_period_days: 10,
    });

  const openContributionDialog = (row?: any) => {
    if (!row) {
      resetContributionForm();
      setContributionForm((prev) => ({ ...prev, open: true }));
      return;
    }
    setContributionForm({
      open: true,
      name: row.name,
      member: row.member,
      month: row.contribution_month ? row.contribution_month.slice(0, 7) : "",
      amount: row.amount ? String(row.amount) : "",
      method: row.method || paymentMethods[0],
      status: row.status || contributionStatuses[0],
      create_payment: !row.payment,
    });
  };

  const openCommitmentDialog = (row?: any) => {
    if (!row) {
      resetCommitmentForm();
      setCommitmentForm((prev) => ({ ...prev, open: true }));
      return;
    }
    setCommitmentForm({
      open: true,
      name: row.name,
      member: row.member,
      committed: !!row.committed,
      monthly_amount: row.monthly_amount ? String(row.monthly_amount) : "",
      method: row.method || paymentMethods[0],
      frequency: row.frequency || frequencies[0],
      status: row.status || commitmentStatuses[0],
      activation_threshold: row.activation_threshold ?? 2,
      lapse_threshold: row.lapse_threshold ?? 2,
      grace_period_days: row.grace_period_days ?? 10,
    });
  };

  const submitContribution = async () => {
    if (!contributionForm.member || !contributionForm.month || !contributionForm.amount) {
      toast.error("Member, month, and amount are required");
      return;
    }
    await saveContribution.mutateAsync({
      name: contributionForm.name || undefined,
      member: contributionForm.member,
      contribution_month: `${contributionForm.month}-01`,
      amount: Number(contributionForm.amount),
      method: contributionForm.method,
      status: contributionForm.status,
      create_payment: contributionForm.create_payment,
    });
    resetContributionForm();
  };

  const submitCommitment = async () => {
    if (!commitmentForm.member) {
      toast.error("Member is required");
      return;
    }
    await saveCommitment.mutateAsync({
      name: commitmentForm.name || undefined,
      member: commitmentForm.member,
      committed: commitmentForm.committed,
      monthly_amount: commitmentForm.monthly_amount ? Number(commitmentForm.monthly_amount) : undefined,
      method: commitmentForm.method,
      frequency: commitmentForm.frequency,
      status: commitmentForm.status,
      activation_threshold: commitmentForm.activation_threshold,
      lapse_threshold: commitmentForm.lapse_threshold,
      grace_period_days: commitmentForm.grace_period_days,
    });
    resetCommitmentForm();
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6">Tithe Overview</Typography>
          <Typography color="text.secondary" variant="body2">
            Snapshot of commitments and giving performance.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Metric title="Active commitments" value={overview.active_commitments ?? 0} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Metric title="Monthly pledged" value={overview.pledged_amount ?? 0} prefix="$" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Metric title="Paid this period" value={overview.paid_amount ?? 0} prefix="$" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Metric title="Delinquent members" value={overview.delinquent_count ?? 0} variant={overview.delinquent_count ? "warning" : "success"} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
            <Typography variant="h6">Payment Gateways</Typography>
            <Button variant="outlined" onClick={()=> { if (typeof window !== 'undefined') { window.open('/app/payment-gateway-account', '_blank', 'noopener'); } }}>
              Manage in Desk
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {gatewaysQ.isLoading ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={24} />
            </Stack>
          ) : gatewaysQ.isError ? (
            <Alert severity="error">Unable to load payment gateway configuration.</Alert>
          ) : gateways.length ? (
            <List disablePadding>
              {gateways.map((gateway) => (
                <ListItem key={gateway.key} disablePadding sx={{ mb: 1 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                      width: '100%',
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: gateway.configured ? 'divider' : 'warning.main',
                      backgroundImage: gateway.brand_color ? `linear-gradient(90deg, ${gateway.brand_color}14, transparent)` : undefined,
                    }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar variant="rounded" src={gateway.logo} sx={{ bgcolor: gateway.brand_color || 'primary.main', color: '#fff', width: 40, height: 40 }}>{gateway.label.charAt(0)}</Avatar>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>{gateway.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{gateway.description}</Typography>
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                      {gateway.supports_wallets && <Chip size="small" variant="outlined" label="Wallets" />}
                      <Chip size="small" color={gateway.active ? 'success' : 'default'} label={gateway.active ? 'Active' : 'Disabled'} />
                      <Chip size="small" color={gateway.configured ? 'success' : 'warning'} label={gateway.configured ? 'Keys stored' : 'Needs keys'} />
                    </Stack>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">No gateways have been configured yet. Add Stripe, PayPal, Apple Pay, Google Pay, or Interac e-Transfer to unlock online giving.</Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
            <Typography variant="h6">Commitments</Typography>
            <Button variant="outlined" onClick={()=> openCommitmentDialog()}>
              New commitment
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pledge</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Next Due</TableCell>
                <TableCell width={120}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commitments.map((row: any) => (
                <TableRow key={row.name}>
                  <TableCell>{row.member}</TableCell>
                  <TableCell><Chip size="small" label={row.status} color={row.status === "Active" ? "success" : row.status === "Paused" ? "warning" : "default"} /></TableCell>
                  <TableCell>{row.monthly_amount ? `$${Number(row.monthly_amount).toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{row.method || "—"}</TableCell>
                  <TableCell>{row.next_due_date ? new Date(row.next_due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={()=> openCommitmentDialog(row)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {commitments.length === 0 && (
                <TableRow><TableCell colSpan={6}><Typography color="text.secondary">No commitments recorded.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
            <Typography variant="h6">Contribution History</Typography>
            <Button variant="contained" onClick={()=> openContributionDialog()} disableElevation>
              Record contribution
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell width={150}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((row: any) => (
                <TableRow key={row.name}>
                  <TableCell>{row.contribution_month ? new Date(row.contribution_month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "—"}</TableCell>
                  <TableCell>{row.member}</TableCell>
                  <TableCell><Chip size="small" label={row.status} color={row.status === "Paid" ? "success" : row.status === "Pending" ? "warning" : "default"} /></TableCell>
                  <TableCell>{row.method || "—"}</TableCell>
                  <TableCell align="right">{row.amount ? `$${Number(row.amount).toLocaleString()}` : "—"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={()=> openContributionDialog(row)}>Edit</Button>
                      <Button size="small" color="error" onClick={()=> {
                        if (window.confirm("Remove this contribution?")) {
                          removeContribution.mutate(row.name);
                        }
                      }}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {contributions.length === 0 && (
                <TableRow><TableCell colSpan={6}><Typography color="text.secondary">No contributions yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={contributionForm.open} onClose={resetContributionForm} maxWidth="sm" fullWidth>
        <DialogTitle>{contributionForm.name ? "Update contribution" : "Record contribution"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Member" select required disabled={membersQ.isLoading} value={contributionForm.member} onChange={(e)=> setContributionForm({ ...contributionForm, member: e.target.value })}>
              <MenuItem value="" disabled>Select member</MenuItem>
              {members.map((m: any) => (
                <MenuItem key={m.name} value={m.name}>{m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : m.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Month" type="month" required value={contributionForm.month} onChange={(e)=> setContributionForm({ ...contributionForm, month: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Amount" type="number" required value={contributionForm.amount} onChange={(e)=> setContributionForm({ ...contributionForm, amount: e.target.value })} />
            <TextField label="Method" select value={contributionForm.method} onChange={(e)=> setContributionForm({ ...contributionForm, method: String(e.target.value) })}>
              {paymentMethods.map((mm) => (<MenuItem key={mm} value={mm}>{mm}</MenuItem>))}
            </TextField>
            <TextField label="Status" select value={contributionForm.status} onChange={(e)=> setContributionForm({ ...contributionForm, status: String(e.target.value) })}>
              {contributionStatuses.map((st) => (<MenuItem key={st} value={st}>{st}</MenuItem>))}
            </TextField>
            <FormControlLabel control={<Checkbox checked={contributionForm.create_payment} onChange={(e)=> setContributionForm({ ...contributionForm, create_payment: e.target.checked })} />} label="Create Payment record" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetContributionForm}>Cancel</Button>
          <Button variant="contained" disableElevation disabled={saveContribution.isPending} onClick={submitContribution}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={commitmentForm.open} onClose={resetCommitmentForm} maxWidth="sm" fullWidth>
        <DialogTitle>{commitmentForm.name ? "Update commitment" : "New commitment"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Member" select required disabled={membersQ.isLoading} value={commitmentForm.member} onChange={(e)=> setCommitmentForm({ ...commitmentForm, member: e.target.value })}>
              <MenuItem value="" disabled>Select member</MenuItem>
              {members.map((m: any) => (
                <MenuItem key={m.name} value={m.name}>{m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : m.name}</MenuItem>
              ))}
            </TextField>
            <FormControlLabel control={<Checkbox checked={commitmentForm.committed} onChange={(e)=> setCommitmentForm({ ...commitmentForm, committed: e.target.checked })} />} label="Committed" />
            <TextField label="Monthly pledge" type="number" value={commitmentForm.monthly_amount} onChange={(e)=> setCommitmentForm({ ...commitmentForm, monthly_amount: e.target.value })} />
            <TextField label="Preferred method" select value={commitmentForm.method} onChange={(e)=> setCommitmentForm({ ...commitmentForm, method: String(e.target.value) })}>
              {paymentMethods.map((mm) => (<MenuItem key={mm} value={mm}>{mm}</MenuItem>))}
            </TextField>
            <TextField label="Frequency" select value={commitmentForm.frequency} onChange={(e)=> setCommitmentForm({ ...commitmentForm, frequency: String(e.target.value) })}>
              {frequencies.map((fr) => (<MenuItem key={fr} value={fr}>{fr}</MenuItem>))}
            </TextField>
            <TextField label="Status" select value={commitmentForm.status} onChange={(e)=> setCommitmentForm({ ...commitmentForm, status: String(e.target.value) })}>
              {commitmentStatuses.map((st) => (<MenuItem key={st} value={st}>{st}</MenuItem>))}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Activate after" type="number" helperText="Consecutive paid months" value={commitmentForm.activation_threshold} onChange={(e)=> setCommitmentForm({ ...commitmentForm, activation_threshold: Number(e.target.value) })} />
              <TextField label="Lapse after" type="number" helperText="Consecutive missed months" value={commitmentForm.lapse_threshold} onChange={(e)=> setCommitmentForm({ ...commitmentForm, lapse_threshold: Number(e.target.value) })} />
              <TextField label="Grace days" type="number" value={commitmentForm.grace_period_days} onChange={(e)=> setCommitmentForm({ ...commitmentForm, grace_period_days: Number(e.target.value) })} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetCommitmentForm}>Cancel</Button>
          <Button variant="contained" disableElevation disabled={saveCommitment.isPending} onClick={submitCommitment}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function Metric({ title, value, prefix, variant = "default" }: { title: string; value: number; prefix?: string; variant?: "default" | "success" | "warning" }) {
  return (
    <Stack spacing={0.5} sx={{ p: 1.5, borderRadius: 1, border: (theme) => `1px solid ${theme.palette.divider}` }}>
      <Typography color="text.secondary" variant="body2">{title}</Typography>
      <Typography variant="h6" color={variant === "success" ? "success.main" : variant === "warning" ? "warning.main" : "text.primary"}>
        {prefix ?? ""}{typeof value === "number" ? value.toLocaleString() : value}
      </Typography>
    </Stack>
  );
}
