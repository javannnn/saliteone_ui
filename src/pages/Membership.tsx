import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useMemo, useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import DateField from "@/components/ui/DateField";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyMember, updateMyMember, listMyPayments, listMySponsorships, listMyFamily, upsertFamilyMember, deleteFamilyMember, getMyStatus, setMyTitheCommitment, getMyTitheSummary, listMyTitheContributions, listMyNotifications, markNotificationRead, markAllNotificationsRead, listDocs, listPaymentGateways, initiatePayment, type PaymentGateway, type PaymentIntentResponse } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

export default function Membership() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const meQ = useQuery({ queryKey: ["me-member"], queryFn: getMyMember });
  const [payFilters, setPayFilters] = useState<{ from?: string; to?: string; method?: string; status?: string }>({});
  const payQ = useQuery({ queryKey: ["me-payments", payFilters], queryFn: () => listMyPayments(100, payFilters.from, payFilters.to, payFilters.method, payFilters.status), enabled: tab===2 });
  const spQ = useQuery({ queryKey: ["me-sponsorships"], queryFn: () => listMySponsorships(50), enabled: tab===3 });
  const beneficiariesQ = useQuery({ queryKey: ["me-beneficiaries", meQ.data?.name], queryFn: async ()=> meQ.data?.name ? await listDocs<any>("Sponsorship", { fields: ["name","beneficiary","sponsor","frequency","status","start_date"], filters: { beneficiary: meQ.data.name }, order_by: "modified desc", limit: 50 }) : [], enabled: tab===3 && !!meQ.data?.name });
  const famQ = useQuery({ queryKey: ["me-family"], queryFn: () => listMyFamily(), enabled: tab===0 });
  const statusQ = useQuery({ queryKey: ["me-status"], queryFn: getMyStatus, enabled: tab===1 });
  const titheSummaryQ = useQuery({ queryKey: ["me-tithe-summary"], queryFn: getMyTitheSummary, enabled: tab===1 });
  const titheHistoryQ = useQuery({ queryKey: ["me-tithe-contribs"], queryFn: () => listMyTitheContributions(12), enabled: tab===1 });
  const notifQ = useQuery({ queryKey: ["me-notifs"], queryFn: () => listMyNotifications(5) });
  const mu = useMutation({ mutationFn: (patch: any) => updateMyMember(patch), onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ["me-member"] }); } });
  const muFam = useMutation({
    mutationFn: (child:any) => upsertFamilyMember(child),
    onMutate: async (child:any) => {
      await qc.cancelQueries({ queryKey: ["me-family"] });
      const prev = qc.getQueryData<any[]>(["me-family"]);
      if (prev) {
        if (child.name) {
          qc.setQueryData(["me-family"], prev.map(r => r.name === child.name ? { ...r, ...child } : r));
        } else {
          qc.setQueryData(["me-family"], [{ name: "temp-"+Date.now(), ...child }, ...prev]);
        }
      }
      return { prev };
    },
    onError: (_e,_v,ctx:any) => { if (ctx?.prev) qc.setQueryData(["me-family"], ctx.prev); },
    onSuccess: () => toast.success('Family updated'),
    onSettled: () => qc.invalidateQueries({ queryKey: ["me-family"] })
  });
  const muFamDel = useMutation({
    mutationFn: (name:string) => deleteFamilyMember(name),
    onMutate: async (name:string) => {
      await qc.cancelQueries({ queryKey: ["me-family"] });
      const prev = qc.getQueryData<any[]>(["me-family"]);
      if (prev) qc.setQueryData(["me-family"], prev.filter(r => r.name !== name));
      return { prev };
    },
    onError: (_e,_v,ctx:any) => { if (ctx?.prev) qc.setQueryData(["me-family"], ctx.prev); },
    onSuccess: () => toast.success('Family removed'),
    onSettled: () => qc.invalidateQueries({ queryKey: ["me-family"] })
  });
  const muTithe = useMutation({
    mutationFn: (p:any) => setMyTitheCommitment(p),
    onSuccess: () => {
      toast.success('Tithe updated');
      qc.invalidateQueries({ queryKey: ["me-status"] });
      qc.invalidateQueries({ queryKey: ["me-tithe-summary"] });
      qc.invalidateQueries({ queryKey: ["me-tithe-contribs"] });
    }
  });
  const [titheForm, setTitheForm] = useState<{ committed: boolean; monthly_amount: string; method: string }>({ committed: false, monthly_amount: "", method: "" });
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentIntentResponse | null>(null);
  const paymentGatewaysQ = useQuery<PaymentGateway[]>({ queryKey: ["payment-gateways"], queryFn: listPaymentGateways, enabled: payDialogOpen });
  const paymentIntent = useMutation<PaymentIntentResponse, unknown, { gatewayKey: string; amount: number; member: string; commitment?: string | null; metadata?: Record<string, unknown> }>({
    mutationFn: async ({ gatewayKey, amount, member, commitment: commitmentName, metadata }) => {
      return await initiatePayment({
        provider: gatewayKey,
        amount,
        member,
        currency: ((titheSummaryQ.data?.commitment as any)?.currency as string) || "USD",
        commitment: commitmentName ?? null,
        metadata,
      });
    },
    onSuccess: (res) => {
      setPaymentResult(res);
      if (res?.status === "pending") {
        toast.success('Payment intent recorded');
        qc.invalidateQueries({ queryKey: ["me-payments"] });
        qc.invalidateQueries({ queryKey: ["payments"] });
        qc.invalidateQueries({ queryKey: ["me-status"] });
      }
    },
    onError: (err: any) => {
      const message = err?.message || 'Unable to start payment right now.';
      setPaymentResult({ status: 'error', message });
      toast.error(message);
    },
  });
  const [del, setDel] = useState<{ open: boolean; name?: string }>({ open: false });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; phone?: string; gender?: string; marital_status?: string }>({});
  useEffect(()=>{
    if (meQ.data) {
      setProfile({
        first_name: meQ.data.first_name || "",
        last_name: meQ.data.last_name || "",
        phone: meQ.data.phone || "",
        gender: meQ.data.gender || "",
        marital_status: meQ.data.marital_status || "",
      });
    }
  }, [meQ.data]);
  useEffect(()=>{
    const commit = titheSummaryQ.data?.commitment;
    if (commit) {
      setTitheForm({
        committed: !!commit.committed,
        monthly_amount: commit.monthly_amount ? String(commit.monthly_amount) : "",
        method: commit.method || "",
      });
    } else {
      setTitheForm({ committed: false, monthly_amount: "", method: "" });
    }
  }, [titheSummaryQ.data?.commitment?.name, titheSummaryQ.data?.commitment?.monthly_amount, titheSummaryQ.data?.commitment?.method, titheSummaryQ.data?.commitment?.status]);
  useEffect(()=>{
    if (payDialogOpen) {
      const baseAmount = Number(titheSummaryQ.data?.commitment?.monthly_amount ?? titheForm.monthly_amount ?? 0);
      setPayAmount(baseAmount && !Number.isNaN(baseAmount) ? String(baseAmount) : "");
      setPaymentResult(null);
      setSelectedGateway(null);
    }
  }, [payDialogOpen, titheSummaryQ.data?.commitment?.monthly_amount, titheForm.monthly_amount]);

  const [newFam, setNewFam] = useState<{ full_name: string; relation: "Spouse"|"Child"|""; dob?: string; phone?: string; email?: string }>({ full_name: "", relation: "" });

  const m = meQ.data || {};
  const titheStats: any = titheSummaryQ.data?.stats ?? statusQ.data?.tithe ?? {};
  const contributions: any[] = titheHistoryQ.data || [];
  const commitment = titheSummaryQ.data?.commitment;
  const commitmentCurrencyRaw = (commitment as any)?.currency;
  const currencyLabel = typeof commitmentCurrencyRaw === 'string' && commitmentCurrencyRaw ? commitmentCurrencyRaw.toUpperCase() : 'USD';
  const defaultPledgeAmount = Number(commitment?.monthly_amount ?? titheForm.monthly_amount ?? 0);
  const normalizedPledgeAmount = Number.isFinite(defaultPledgeAmount) && defaultPledgeAmount > 0 ? defaultPledgeAmount : 0;
  const paymentGateways = paymentGatewaysQ.data ?? [];
  const paymentAlertSeverity = paymentResult ? (paymentResult.status === 'pending' ? 'success' : paymentResult.status === 'needs_configuration' ? 'warning' : paymentResult.status === 'error' ? 'error' : 'info') : undefined;
  const lastPaymentLabel = titheStats?.last_tithe_payment_on ? new Date(titheStats.last_tithe_payment_on).toLocaleDateString() : "No payments yet";
  const nextDueDisplay = commitment?.next_due_date ? new Date(commitment.next_due_date).toLocaleDateString() : "--";
  const saveTitheDisabled = muTithe.isPending || (titheForm.committed && !titheForm.monthly_amount);
  const handleGatewaySelect = async (gatewayKey: string) => {
    const amt = Number(payAmount);
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      setPaymentResult({ status: 'error', message: 'Enter a payment amount greater than zero.' });
      return;
    }
    if (!meQ.data?.name) {
      setPaymentResult({ status: 'error', message: 'Member record not yet loaded.' });
      return;
    }
    setSelectedGateway(gatewayKey);
    setPaymentResult(null);
    try {
      await paymentIntent.mutateAsync({
        gatewayKey,
        amount: amt,
        member: meQ.data.name,
        commitment: commitment?.name ?? null,
        metadata: {
          source: 'membership',
          tithe_paid_streak: titheStats?.tithe_paid_streak ?? 0,
        },
      });
    } catch (error) {
      // handled by mutation onError
    }
  };
  const handleClosePaymentDialog = () => {
    if (!paymentIntent.isPending) {
      setPayDialogOpen(false);
    }
  };

  return (
    <>
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>My Membership</Typography>
        {Array.isArray(notifQ.data) && notifQ.data.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Notifications</Typography>
              <Stack spacing={1}>
                {notifQ.data.map((n:any)=> (
                  <Stack key={n.name} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">{n.subject}: {n.email_content}</Typography>
                    {!n.read && <Button size="small" onClick={async ()=>{ await markNotificationRead(n.name); notifQ.refetch(); }}>Mark as read</Button>}
                  </Stack>
                ))}
                <Stack direction="row" justifyContent="flex-end">
                  <Button size="small" onClick={async ()=>{ await markAllNotificationsRead(); notifQ.refetch(); }}>Mark all as read</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 2 }}>
          <Tab label="Profile & Family" />
          <Tab label="Status" />
          <Tab label="Payments & Tithes" />
          <Tab label="Sponsorships" />
          <Tab label="Schools" />
        </Tabs>

        {tab===0 && (
          <Stack spacing={3}>
            <Stack spacing={2} maxWidth={640}>
              <Alert severity="info">Your profile information</Alert>
              {!editingProfile ? (
                <Stack spacing={1}>
                  <Typography variant="body2">Name: {m.first_name} {m.last_name}</Typography>
                  <Typography variant="body2">Phone: {m.phone || "-"}</Typography>
                  <Typography variant="body2">Gender: {m.gender || "-"}</Typography>
                  <Typography variant="body2">Marital status: {m.marital_status || "-"}</Typography>
                  <Stack direction="row" spacing={1}><Button variant="outlined" onClick={()=>setEditingProfile(true)}>Edit</Button></Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField label="First name" value={profile.first_name || ""} onChange={(e)=>setProfile({ ...profile, first_name: e.target.value })} sx={{ flex: 1 }}/>
                    <TextField label="Last name" value={profile.last_name || ""} onChange={(e)=>setProfile({ ...profile, last_name: e.target.value })} sx={{ flex: 1 }}/>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField label="Phone" value={profile.phone || ""} onChange={(e)=>setProfile({ ...profile, phone: e.target.value })} sx={{ flex: 1 }}/>
                    <TextField label="Gender" select value={profile.gender || ""} onChange={(e)=>setProfile({ ...profile, gender: String(e.target.value) })} sx={{ flex: 1 }}>
                      {["Male","Female"].map(g=> (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                    </TextField>
                  </Stack>
                  <TextField label="Marital status" select value={profile.marital_status || ""} onChange={(e)=>setProfile({ ...profile, marital_status: String(e.target.value) })} sx={{ maxWidth: 320 }}>
                    {["Single","Married","Divorced","Widowed"].map(s=> (<MenuItem key={s} value={s}>{s}</MenuItem>))}
                  </TextField>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={async ()=>{ await mu.mutateAsync(profile); setEditingProfile(false); meQ.refetch(); }}>Save</Button>
                    <Button onClick={()=>{ setEditingProfile(false); meQ.refetch(); }}>Cancel</Button>
                  </Stack>
                </Stack>
              )}
            </Stack>

            <Stack spacing={2}>
              <Typography variant="subtitle1">Family</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Relation</TableCell><TableCell>DOB</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell width={80}></TableCell></TableRow></TableHead>
                <TableBody>
                  {(famQ.data || []).map((row:any)=> (
                    <TableRow key={row.name}>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack spacing={0.5}>
                          <TextField defaultValue={row.full_name} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, full_name: e.target.value })} />
                          {row.relation === "Child" && row.dob && daysUntil18(row.dob) > 0 && (
                            <Chip size="small" label={`Turns 18 in ${humanizeDays(daysUntil18(row.dob))}`} color="warning" variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <TextField select defaultValue={row.relation} size="small" onChange={(e)=>muFam.mutate({ name: row.name, relation: e.target.value })}>
                          {(["Spouse","Child"] as const).map(r => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <DateField value={row.dob || ""} onChange={(v)=>muFam.mutate({ name: row.name, dob: v })} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField defaultValue={row.phone} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, phone: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <TextField defaultValue={row.email} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, email: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Button color="error" size="small" onClick={()=> setDel({ open: true, name: row.name })}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell><TextField size="small" placeholder="Full name" value={newFam.full_name} onChange={(e)=>setNewFam({ ...newFam, full_name: e.target.value })} /></TableCell>
                    <TableCell>
                    <TextField size="small" select placeholder="Relation" value={newFam.relation} onChange={(e)=>setNewFam({ ...newFam, relation: e.target.value as any })} helperText={newFam.relation==='Child' ? 'DOB required for Child' : ''}>
                        <MenuItem value="Spouse">Spouse</MenuItem>
                        <MenuItem value="Child">Child</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <DateField value={newFam.dob || ""} onChange={(v)=>setNewFam({ ...newFam, dob: v })} size="small" />
                    </TableCell>
                    <TableCell><TextField size="small" placeholder="Phone" value={newFam.phone || ""} onChange={(e)=>setNewFam({ ...newFam, phone: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" placeholder="Email" value={newFam.email || ""} onChange={(e)=>setNewFam({ ...newFam, email: e.target.value })} /></TableCell>
                    <TableCell>
                      <Button size="small" disabled={!newFam.full_name || !newFam.relation || (newFam.relation==='Child' && !newFam.dob)} onClick={()=>{
                        muFam.mutate({ ...newFam });
                        setNewFam({ full_name: "", relation: "", dob: "", phone: "", email: "" });
                      }}>Add</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {/* Turning-18 banners (within 30 days) */}
              {Array.isArray(famQ.data) && famQ.data.filter((r:any)=> r.relation==="Child" && r.dob && daysUntil18(r.dob) > 0 && daysUntil18(r.dob) <= 30).map((r:any)=> (
                <Alert key={r.name} severity="warning">{r.full_name} turns 18 in {humanizeDays(daysUntil18(r.dob))}. Please review status.</Alert>
              ))}
            </Stack>
          </Stack>
        )}

        {tab===1 && (
          <Stack spacing={2} maxWidth={720}>
            <Typography color="text.secondary">Membership Status</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Typography variant="h5" sx={{ mt: 1 }}>{statusQ.data?.status || m.status || "Unknown"}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" variant="outlined" color="success" label={`Paid streak: ${titheStats?.tithe_paid_streak ?? 0}`} />
                <Chip size="small" variant="outlined" color={(titheStats?.tithe_missed_streak ?? 0) > 0 ? "warning" : "default"} label={`Missed: ${titheStats?.tithe_missed_streak ?? 0}`} />
                <Chip size="small" variant="outlined" label={`Last payment: ${lastPaymentLabel}`} />
              </Stack>
            </Stack>
            {statusQ.data?.reason && <Alert severity="info">{statusQ.data.reason}</Alert>}
            <Divider flexItem />
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Typography variant="subtitle1">Tithe Commitment</Typography>
                    <Chip size="small" color={commitment?.status === "Active" && commitment?.committed ? "success" : "default"} label={commitment?.status ? commitment.status : "Not set"} />
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Switch checked={titheForm.committed} onChange={(e)=> setTitheForm({ ...titheForm, committed: e.target.checked })} />
                    <Typography>{titheForm.committed ? "I will contribute monthly" : "Not currently pledged"}</Typography>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField label="Monthly pledge" type="number" size="small" value={titheForm.monthly_amount} onChange={(e)=> setTitheForm({ ...titheForm, monthly_amount: e.target.value })} disabled={!titheForm.committed} sx={{ minWidth: 180 }} />
                    <TextField label="Preferred method" size="small" select value={titheForm.method} onChange={(e)=> setTitheForm({ ...titheForm, method: String(e.target.value) })} disabled={!titheForm.committed} sx={{ minWidth: 180 }}>
                      <MenuItem value="">Select</MenuItem>
                      {["Cash","Debit","Credit","E-Transfer","Other"].map(mm=> (<MenuItem key={mm} value={mm}>{mm}</MenuItem>))}
                    </TextField>
                    <TextField label="Next due" size="small" value={nextDueDisplay} InputProps={{ readOnly: true }} sx={{ minWidth: 160 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="contained" disableElevation disabled={saveTitheDisabled} onClick={()=> {
                      muTithe.mutate({
                        committed: titheForm.committed,
                        monthly_amount: titheForm.monthly_amount !== "" ? Number(titheForm.monthly_amount) : undefined,
                        method: titheForm.method || undefined,
                      });
                    }}>Save</Button>
                    <Button onClick={()=>{
                      const commit = titheSummaryQ.data?.commitment;
                      setTitheForm({
                        committed: !!commit?.committed,
                        monthly_amount: commit?.monthly_amount ? String(commit.monthly_amount) : "",
                        method: commit?.method || "",
                      });
                      titheSummaryQ.refetch();
                    }}>Reset</Button>
                    <Button variant="outlined" color="secondary" disabled={paymentIntent.isPending} onClick={()=> setPayDialogOpen(true)}>Make a Payment</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle1">Contribution History</Typography>
                  {contributions.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">No contributions recorded yet.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Month</TableCell><TableCell>Status</TableCell><TableCell>Method</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                      <TableBody>
                        {contributions.map((c:any)=> (
                          <TableRow key={c.name}>
                            <TableCell>{c.contribution_month ? new Date(c.contribution_month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '--'}</TableCell>
                            <TableCell>{c.status}</TableCell>
                            <TableCell>{c.method || '—'}</TableCell>
                            <TableCell align="right">{typeof c.amount === 'number' ? c.amount.toLocaleString() : c.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {Array.isArray(notifQ.data) && notifQ.data.filter((n:any)=> /Tithe reminder/i.test(n.subject)).slice(0,3).map((n:any)=> (
                    <Typography key={n.name} variant="caption" color="text.secondary">Reminder sent: {new Date(n.creation).toLocaleString()}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {tab===2 && (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField size="small" label="From" type="date" value={payFilters.from||""} onChange={(e)=>setPayFilters({ ...payFilters, from: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField size="small" label="To" type="date" value={payFilters.to||""} onChange={(e)=>setPayFilters({ ...payFilters, to: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField size="small" label="Method" value={payFilters.method||""} onChange={(e)=>setPayFilters({ ...payFilters, method: e.target.value })} />
              <TextField size="small" label="Status" value={payFilters.status||""} onChange={(e)=>setPayFilters({ ...payFilters, status: e.target.value })} />
              <Button variant="outlined" onClick={()=>exportPaymentsCSV(payQ.data||[])}>Export CSV</Button>
            </Stack>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell>Gateway</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {(payQ.data || []).map((p:any)=> (
                  <TableRow key={p.name}>
                    <TableCell>{p.posting_date}</TableCell>
                    <TableCell>{p.method || p.mode_of_payment || "-"}</TableCell>
                    <TableCell>{p.gateway || '—'}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell align="right">{p.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}

        {tab===3 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">My Sponsors</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Frequency</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {(spQ.data || []).map((s:any)=> (
                  <TableRow key={s.name}><TableCell>{s.sponsor || s.name}</TableCell><TableCell>{s.frequency}</TableCell><TableCell>{s.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="subtitle2">My Beneficiaries</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Frequency</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {(beneficiariesQ.data || []).map((s:any)=> (
                  <TableRow key={s.name}><TableCell>{s.beneficiary || s.name}</TableCell><TableCell>{s.frequency}</TableCell><TableCell>{s.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}

        {tab===4 && (
          <Box color="text.secondary">Linked schools and registrations — coming soon.</Box>
        )}
      </CardContent>
    </Card>
    <Dialog open={payDialogOpen} onClose={handleClosePaymentDialog} fullWidth maxWidth="sm">
      <DialogTitle>Make a Tithe Payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label={`Amount (${currencyLabel})`}
            type="number"
            value={payAmount}
            onChange={(e)=> setPayAmount(e.target.value)}
            inputProps={{ min: 1, step: "0.01" }}
            helperText={normalizedPledgeAmount ? `Suggested pledge: ${normalizedPledgeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyLabel}` : 'Enter the amount you wish to contribute now.'}
          />
          <Typography variant="body2" color="text.secondary">
            Choose a provider below. Wallet buttons (Apple Pay, Google Pay) will appear automatically once the gateway is live.
          </Typography>
          {paymentResult && (
            <Alert severity={paymentAlertSeverity || 'info'}>
              <Stack spacing={1}>
                <Typography variant="body2">{paymentResult.message || (paymentResult.status === 'pending' ? 'Payment intent recorded. Follow the checkout instructions to finish the transaction.' : 'Status updated.')}</Typography>
                {paymentResult.checkout_url && (
                  <Button size="small" variant="outlined" onClick={()=> window.open(paymentResult.checkout_url as string, '_blank', 'noopener,noreferrer')}>Open Checkout</Button>
                )}
              </Stack>
            </Alert>
          )}
          {paymentGatewaysQ.isLoading ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={24} />
            </Stack>
          ) : paymentGatewaysQ.isError ? (
            <Alert severity="error">Unable to load payment gateways right now.</Alert>
          ) : paymentGateways.length ? (
            <List disablePadding>
              {paymentGateways.map((gateway) => (
                <ListItem key={gateway.key} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    disabled={paymentIntent.isPending || gateway.requires_configuration || !gateway.active}
                    onClick={()=> handleGatewaySelect(gateway.key)}
                    selected={selectedGateway === gateway.key}
                    sx={{
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: selectedGateway === gateway.key ? 'primary.main' : 'divider',
                      backgroundImage: gateway.brand_color ? `linear-gradient(90deg, ${gateway.brand_color}22, transparent)` : undefined,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar variant="rounded" src={gateway.logo} sx={{ bgcolor: gateway.brand_color || 'primary.main', color: '#fff' }}>{gateway.label.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={gateway.label} secondary={gateway.description} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      {gateway.supports_wallets && <Chip size="small" variant="outlined" label="Wallets" />}
                      <Chip size="small" color={gateway.requires_configuration ? 'warning' : gateway.active ? 'success' : 'default'} label={gateway.requires_configuration ? 'Needs setup' : gateway.active ? 'Ready' : 'Inactive'} />
                      {paymentIntent.isPending && selectedGateway === gateway.key && <CircularProgress size={18} />}
                    </Stack>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">No payment gateways are configured yet. Finance can enable Stripe, PayPal, Apple Pay, Google Pay, or e-Transfer from the admin console.</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClosePaymentDialog} disabled={paymentIntent.isPending}>Close</Button>
      </DialogActions>
    </Dialog>
    <ConfirmDialog open={del.open} title="Delete family member?" onClose={()=>setDel({ open:false })} onConfirm={()=>{ if (del.name) muFamDel.mutate(del.name); setDel({ open:false }); }} />
    </>
  );
}

function exportPaymentsCSV(rows: any[]) {
  const header = ["posting_date","method","gateway","status","amount"];
  const lines = [header.join(","), ...rows.map((r)=> header.map((h)=> (r[h] ?? r["mode_of_payment"] ?? "")).toString())] as any;
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `payments.csv`;
  a.click();
}

function isTurning18Today(dob: string) {
  try {
    const d = new Date(dob);
    const today = new Date();
    const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate());
    return (
      eighteen.getFullYear() === today.getFullYear() &&
      eighteen.getMonth() === today.getMonth() &&
      eighteen.getDate() === today.getDate()
    );
  } catch { return false; }
}

function daysUntil18(dob: string) {
  try {
    const d = new Date(dob);
    const today = new Date();
    const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate());
    const ms = eighteen.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  } catch { return 0; }
}

function humanizeDays(days: number) {
  if (days <= 0) return "today";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? `${months} mo ${rem} d` : `${months} months`;
}
