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
import { useEffect, useMemo, useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import DateField from "@/components/ui/DateField";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyMember, updateMyMember, listMyPayments, listMySponsorships, listMyFamily, upsertFamilyMember, deleteFamilyMember, getMyStatus, setMyTitheCommitment, listMyNotifications, markNotificationRead, markAllNotificationsRead, listDocs } from "@/lib/api";
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
  const muTithe = useMutation({ mutationFn: (p:any) => setMyTitheCommitment(p), onSuccess: () => { toast.success('Tithe updated'); qc.invalidateQueries({ queryKey: ["me-status"] }); } });
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

  const [newFam, setNewFam] = useState<{ full_name: string; relation: "Spouse"|"Child"|""; dob?: string; phone?: string; email?: string }>({ full_name: "", relation: "" });

  const m = meQ.data || {};

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
          <Stack spacing={2} maxWidth={560}>
            <Typography color="text.secondary">Membership Status</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{statusQ.data?.status || m.status || "Unknown"}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Monthly Tithe" type="number" size="small" onBlur={(e)=>muTithe.mutate({ committed: true, monthly_amount: Number(e.target.value) || 0 })} />
              <TextField label="Method" size="small" select defaultValue="" onChange={(e)=>muTithe.mutate({ committed: true, method: String(e.target.value) })}>
                {["Cash","Debit","Credit","E-Transfer","Other"].map(mm=> (<MenuItem key={mm} value={mm}>{mm}</MenuItem>))}
              </TextField>
              <Button variant="outlined" onClick={()=>muTithe.mutate({ committed: false })}>Clear Commitment</Button>
            </Stack>
            {statusQ.data?.last_payment && <Typography color="text.secondary">Last payment: {new Date(statusQ.data.last_payment).toLocaleDateString()}</Typography>}
            <Typography color="text.secondary">Next reminder: {estimateNextReminder()}</Typography>
            {Array.isArray(notifQ.data) && notifQ.data.filter((n:any)=> /Tithe reminder/i.test(n.subject)).slice(0,3).map((n:any)=> (
              <Typography key={n.name} variant="caption" color="text.secondary">Reminder: {new Date(n.creation).toLocaleString()}</Typography>
            ))}
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
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {(payQ.data || []).map((p:any)=> (
                  <TableRow key={p.name}><TableCell>{p.posting_date}</TableCell><TableCell>{p.method || p.mode_of_payment || "-"}</TableCell><TableCell>{p.status}</TableCell><TableCell align="right">{p.amount}</TableCell></TableRow>
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
    <ConfirmDialog open={del.open} title="Delete family member?" onClose={()=>setDel({ open:false })} onConfirm={()=>{ if (del.name) muFamDel.mutate(del.name); setDel({ open:false }); }} />
    </>
  );
}

function exportPaymentsCSV(rows: any[]) {
  const header = ["posting_date","method","status","amount"];
  const lines = [header.join(","), ...rows.map((r)=> header.map((h)=> (r[h] ?? r["mode_of_payment"] ?? "")).toString()).map((line)=> line)] as any;
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
