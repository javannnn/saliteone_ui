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
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyMember, updateMyMember, listMyPayments, listMySponsorships } from "@/lib/api";

export default function Membership() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const meQ = useQuery({ queryKey: ["me-member"], queryFn: getMyMember });
  const payQ = useQuery({ queryKey: ["me-payments"], queryFn: () => listMyPayments(50), enabled: tab===2 });
  const spQ = useQuery({ queryKey: ["me-sponsorships"], queryFn: () => listMySponsorships(50), enabled: tab===3 });
  const mu = useMutation({ mutationFn: (patch: any) => updateMyMember(patch), onSuccess: () => qc.invalidateQueries({ queryKey: ["me-member"] }) });

  const m = meQ.data || {};

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>My Membership</Typography>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 2 }}>
          <Tab label="Profile & Family" />
          <Tab label="Status" />
          <Tab label="Payments & Tithes" />
          <Tab label="Sponsorships" />
          <Tab label="Schools" />
        </Tabs>

        {tab===0 && (
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
        )}

        {tab===1 && (
          <Box>
            <Typography color="text.secondary">Membership Status</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{m.status || "Unknown"}</Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>Tithe commitments and reminders — coming soon.</Typography>
          </Box>
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
