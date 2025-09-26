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
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyMember, updateMyMember, listMyPayments, listMySponsorships, listMyFamily, upsertFamilyMember, deleteFamilyMember, getMyStatus, setMyTitheCommitment, listMyNotifications } from "@/lib/api";

export default function Membership() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const meQ = useQuery({ queryKey: ["me-member"], queryFn: getMyMember });
  const payQ = useQuery({ queryKey: ["me-payments"], queryFn: () => listMyPayments(50), enabled: tab===2 });
  const spQ = useQuery({ queryKey: ["me-sponsorships"], queryFn: () => listMySponsorships(50), enabled: tab===3 });
  const famQ = useQuery({ queryKey: ["me-family"], queryFn: () => listMyFamily(), enabled: tab===0 });
  const statusQ = useQuery({ queryKey: ["me-status"], queryFn: getMyStatus, enabled: tab===1 });
  const notifQ = useQuery({ queryKey: ["me-notifs"], queryFn: () => listMyNotifications(5) });
  const mu = useMutation({ mutationFn: (patch: any) => updateMyMember(patch), onSuccess: () => qc.invalidateQueries({ queryKey: ["me-member"] }) });
  const muFam = useMutation({ mutationFn: (child:any) => upsertFamilyMember(child), onSuccess: () => qc.invalidateQueries({ queryKey: ["me-family"] }) });
  const muFamDel = useMutation({ mutationFn: (name:string) => deleteFamilyMember(name), onSuccess: () => qc.invalidateQueries({ queryKey: ["me-family"] }) });
  const muTithe = useMutation({ mutationFn: (p:any) => setMyTitheCommitment(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["me-status"] }) });

  const m = meQ.data || {};

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>My Membership</Typography>
        {Array.isArray(notifQ.data) && notifQ.data.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {notifQ.data[0].subject}: {notifQ.data[0].email_content}
          </Alert>
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
              <Alert severity="info">Update your profile information.</Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="First name" value={m.first_name || ""} onChange={(e)=>mu.mutate({ first_name: e.target.value })} sx={{ flex: 1 }}/>
                <TextField label="Last name" value={m.last_name || ""} onChange={(e)=>mu.mutate({ last_name: e.target.value })} sx={{ flex: 1 }}/>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Phone" value={m.phone || ""} onChange={(e)=>mu.mutate({ phone: e.target.value })} sx={{ flex: 1 }}/>
                <TextField label="Gender" value={m.gender || ""} onChange={(e)=>mu.mutate({ gender: e.target.value })} sx={{ flex: 1 }}/>
              </Stack>
              <TextField label="Marital status" value={m.marital_status || ""} onChange={(e)=>mu.mutate({ marital_status: e.target.value })} sx={{ maxWidth: 320 }}/>
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
                        <TextField defaultValue={row.relation} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, relation: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <TextField defaultValue={row.dob} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, dob: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <TextField defaultValue={row.phone} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, phone: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <TextField defaultValue={row.email} size="small" onBlur={(e)=>muFam.mutate({ name: row.name, email: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Button color="error" size="small" onClick={()=>{ if (confirm("Delete family member?")) muFamDel.mutate(row.name); }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell><TextField size="small" placeholder="Full name" id="fam-fullname" /></TableCell>
                    <TableCell><TextField size="small" placeholder="Spouse/Child" id="fam-relation" /></TableCell>
                    <TableCell><TextField size="small" placeholder="YYYY-MM-DD" id="fam-dob" /></TableCell>
                    <TableCell><TextField size="small" placeholder="Phone" id="fam-phone" /></TableCell>
                    <TableCell><TextField size="small" placeholder="Email" id="fam-email" /></TableCell>
                    <TableCell><Button size="small" onClick={()=>{
                      const full_name=(document.getElementById("fam-fullname") as HTMLInputElement)?.value || "";
                      const relation=(document.getElementById("fam-relation") as HTMLInputElement)?.value || "";
                      const dob=(document.getElementById("fam-dob") as HTMLInputElement)?.value || "";
                      const phone=(document.getElementById("fam-phone") as HTMLInputElement)?.value || "";
                      const email=(document.getElementById("fam-email") as HTMLInputElement)?.value || "";
                      muFam.mutate({ full_name, relation, dob, phone, email });
                    }}>Add</Button></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {/* Turning-18 banner (client-only heuristic) */}
              {Array.isArray(famQ.data) && famQ.data.some((r:any)=> r.relation==="Child" && r.dob && isTurning18Today(r.dob)) && (
                <Alert severity="warning">A child is turning 18 today. Please review their membership status.</Alert>
              )}
            </Stack>
          </Stack>
        )}

        {tab===1 && (
          <Stack spacing={2} maxWidth={560}>
            <Typography color="text.secondary">Membership Status</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{statusQ.data?.status || m.status || "Unknown"}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Monthly Tithe" type="number" size="small" onBlur={(e)=>muTithe.mutate({ committed: true, monthly_amount: Number(e.target.value) || 0 })} />
              <TextField label="Method" size="small" onBlur={(e)=>muTithe.mutate({ committed: true, method: e.target.value })} />
              <Button variant="outlined" onClick={()=>muTithe.mutate({ committed: false })}>Clear Commitment</Button>
            </Stack>
            {statusQ.data?.last_payment && <Typography color="text.secondary">Last payment: {new Date(statusQ.data.last_payment).toLocaleDateString()}</Typography>}
          </Stack>
        )}

        {tab===2 && (
          <Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Mode</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {(payQ.data || []).map((p:any)=> (
                  <TableRow key={p.name}><TableCell>{p.posting_date}</TableCell><TableCell>{p.mode_of_payment}</TableCell><TableCell>{p.status}</TableCell><TableCell align="right">{p.amount}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {tab===3 && (
          <Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Frequency</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {(spQ.data || []).map((s:any)=> (
                  <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell>{s.frequency}</TableCell><TableCell>{s.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {tab===4 && (
          <Box color="text.secondary">Linked schools and registrations — coming soon.</Box>
        )}
      </CardContent>
    </Card>
  );
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
