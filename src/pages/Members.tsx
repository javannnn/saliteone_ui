import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import SkeletonTable from "@/components/ui/SkeletonTable";
import EmptyState from "@/components/ui/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDocs, getDoc } from "@/lib/api";
import { adminCreateMember } from "@/lib/api";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

type Row = { name: string; first_name?: string; last_name?: string; phone?: string; status?: string; email?: string };

export default function Members() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState<{ first_name: string; last_name: string; email: string; phone: string }>({ first_name: "", last_name: "", email: "", phone: "" });
  const [openCreate, setOpenCreate] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<{ open: boolean; name?: string }>({ open: false });

  const membersQ = useQuery({
    queryKey: ["members", q, status],
    queryFn: async () => {
      const filters: any = {};
      if (status) filters.status = status;
      const rows = await listDocs<Row>("Member", { fields: ["name","first_name","last_name","phone","status","email"], filters, order_by: "modified desc", limit: 100 });
      if (!q) return rows;
      const qq = q.toLowerCase();
      return rows.filter((m) => [m.first_name, m.last_name, m.phone, m.email].filter(Boolean).some((v:any)=> String(v).toLowerCase().includes(qq)));
    }
  });

  const createMu = useMutation({
    mutationFn: () => adminCreateMember(creating),
    onSuccess: (res: any) => {
      setOpenCreate(false);
      setCreating({ first_name: "", last_name: "", email: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["members"] });
      if (res?.name) navigate(`/members/${encodeURIComponent(res.name)}`);
    }
  });

  const data = membersQ.data || [];

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "start", sm: "center" }} justifyContent="space-between" spacing={2}>
        <Typography variant="h6">Members Directory</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField size="small" label="Search" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Name, phone, email" />
          <TextField size="small" label="Status" value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="Active/Pending" />
          <Button variant="contained" onClick={()=>setOpenCreate(true)}>Create Member</Button>
        </Stack>
      </Stack>
      <Card>
        <CardContent>
          {!membersQ.data ? <SkeletonTable rows={6}/> : (
            data.length === 0 ? <EmptyState title="No members found" subtitle="Try adjusting your filters"/> : (
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>First</TableCell><TableCell>Last</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell>Email</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {data.map((m) => (
                    <TableRow key={m.name} hover sx={{ cursor: "pointer" }} onClick={()=>setOpenDrawer({ open: true, name: m.name })}>
                      <TableCell>{m.first_name}</TableCell>
                      <TableCell>{m.last_name}</TableCell>
                      <TableCell>{m.phone || "-"}</TableCell>
                      <TableCell>{m.status || "-"}</TableCell>
                      <TableCell>{m.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>

      {/* Create drawer */}
      <Drawer anchor="right" open={openCreate} onClose={()=>setOpenCreate(false)}>
        <Box sx={{ width: 360, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Create Member</Typography>
          <Stack spacing={2}>
            <TextField label="First name" value={creating.first_name} onChange={(e)=>setCreating({ ...creating, first_name: e.target.value })} />
            <TextField label="Last name" value={creating.last_name} onChange={(e)=>setCreating({ ...creating, last_name: e.target.value })} />
            <TextField label="Email" value={creating.email} onChange={(e)=>setCreating({ ...creating, email: e.target.value })} />
            <TextField label="Phone" value={creating.phone} onChange={(e)=>setCreating({ ...creating, phone: e.target.value })} />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={()=>createMu.mutate()} disabled={!creating.first_name || !creating.last_name || !creating.email}>Save</Button>
              <Button onClick={()=>setOpenCreate(false)}>Cancel</Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Detail drawer */}
      <MemberDrawer state={openDrawer} onClose={()=>setOpenDrawer({ open:false })} />
    </Stack>
  );
}

import Box from "@mui/material/Box";

function MemberDrawer({ state, onClose }: { state: { open: boolean; name?: string }; onClose: ()=>void }) {
  const q = useQuery({
    queryKey: ["member-drawer", state.name],
    queryFn: () => getDoc<any>("Member", state.name!, ["name","first_name","last_name","email","phone","status"]),
    enabled: !!state.open && !!state.name,
  });
  const m = q.data || {};
  return (
    <Drawer anchor="right" open={state.open} onClose={onClose}>
      <Box sx={{ width: 380, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Member</Typography>
        <Divider sx={{ mb: 2 }} />
        {!q.data ? <SkeletonTable rows={5}/> : (
          <Stack spacing={1}>
            <Typography variant="body2">ID: {m.name}</Typography>
            <Typography variant="body2">Name: {m.first_name} {m.last_name}</Typography>
            <Typography variant="body2">Email: {m.email || "-"}</Typography>
            <Typography variant="body2">Phone: {m.phone || "-"}</Typography>
            <Typography variant="body2">Status: {m.status || "-"}</Typography>
            <Button variant="outlined" onClick={()=>window.location.href=`/members/${encodeURIComponent(m.name)}`}>Open full</Button>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
