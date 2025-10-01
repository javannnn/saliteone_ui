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
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaymentsIcon from "@mui/icons-material/Payments";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BoltIcon from "@mui/icons-material/Bolt";
import Drawer from "@mui/material/Drawer";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import SkeletonTable from "@/components/ui/SkeletonTable";
import EmptyState from "@/components/ui/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDocs, getDoc, updateDoc } from "@/lib/api";
import { adminCreateMember } from "@/lib/api";
import { createToDo, ensureSystemUserForMember, createProcess } from "@/lib/api";
import { toast } from "sonner";
import MenuItem from "@mui/material/MenuItem";
import TableSortLabel from "@mui/material/TableSortLabel";
import SaveIcon from "@mui/icons-material/Save";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyMember } from "@/lib/api";

type Row = { name: string; first_name?: string; last_name?: string; phone?: string; status?: string; email?: string };

export default function Members() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<keyof Row>('first_name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [preset, setPreset] = useState<string>("");
  const [creating, setCreating] = useState<{ first_name: string; last_name: string; email: string; phone: string }>({ first_name: "", last_name: "", email: "", phone: "" });
  const [openCreate, setOpenCreate] = useState(false);
  const [memberDialog, setMemberDialog] = useState<{ open: boolean; name?: string }>({ open: false });

  const [page, setPage] = useState(0);
  const pageSize = 50;
  useEffect(()=>{
    if (initialized) return;
    const url = new URLSearchParams(window.location.search);
    const vq = url.get('q') || '';
    const vs = url.get('status') || '';
    const sb = (url.get('sortBy') as keyof Row) || 'first_name';
    const sd = (url.get('sortDir') as 'asc'|'desc') || 'asc';
    if (vq) setQ(vq);
    if (vs) setStatus(vs);
    if (sb) setSortBy(sb);
    if (sd) setSortDir(sd);
    setInitialized(true);
  }, [initialized]);

  useEffect(()=>{
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (sortBy) params.set('sortBy', String(sortBy));
    if (sortDir) params.set('sortDir', sortDir);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [q, status, sortBy, sortDir]);
  const membersQ = useQuery({
    queryKey: ["members", q, status, page],
    queryFn: async () => {
      const filters: any = {};
      if (status) filters.status = status;
      const rows = await listDocs<Row>("Member", { fields: ["name","first_name","last_name","phone","status","email"], filters, order_by: "modified desc", limit: pageSize, start: page*pageSize });
      if (!q) return rows;
      const qq = q.toLowerCase();
      return rows.filter((m) => [m.first_name, m.last_name, m.phone, m.email].filter(Boolean).some((v:any)=> String(v).toLowerCase().includes(qq)));
    }
  });

  const createMu = useMutation({
    mutationFn: async () => {
      if (!creating.first_name || !creating.last_name || !creating.email || !/^[^@]+@[^@]+\.[^@]+$/.test(creating.email)) {
        throw new Error("Please provide first, last, and a valid email");
      }
      return await adminCreateMember(creating);
    },
    onSuccess: (res: any) => {
      toast.success("Member created");
      setOpenCreate(false);
      setCreating({ first_name: "", last_name: "", email: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["members"] });
      if (res?.name) navigate(`/members/${encodeURIComponent(res.name)}`);
    },
    onError: (e:any) => toast.error(e?.message || "Failed to create member")
  });

  const data = useMemo(()=>{
    const rows = membersQ.data || [];
    const sorted = [...rows].sort((a:any,b:any)=>{
      const av = (a?.[sortBy] || '').toString().toLowerCase();
      const bv = (b?.[sortBy] || '').toString().toLowerCase();
      if (av < bv) return sortDir==='asc' ? -1 : 1;
      if (av > bv) return sortDir==='asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [membersQ.data, sortBy, sortDir]);

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement|null; row?: Row }>({ el: null });
  const [todo, setTodo] = useState<{ open: boolean; email?: string; subject: string; due?: string }>({ open: false, subject: "" });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "start", sm: "center" }} justifyContent="space-between" spacing={2}>
        <Typography variant="h6">Members Directory</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField data-testid="members-search" size="small" label="Search" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Name, phone, email" />
          <TextField data-testid="members-status" size="small" label="Status" select value={status} onChange={(e)=>setStatus(String(e.target.value))}>
            <MenuItem value="">All</MenuItem>
            {['Active','Pending','Inactive'].map(s=> (<MenuItem key={s} value={s}>{s}</MenuItem>))}
          </TextField>
          <TextField size="small" select label="Presets" value={preset} onChange={(e)=>{
            const name = String(e.target.value); setPreset(name);
            const raw = localStorage.getItem('presets:members');
            const list = raw ? JSON.parse(raw) as Array<{name:string; value:any}> : [];
            const found = list.find(p=>p.name===name);
            if (found) {
              setQ(found.value.q||''); setStatus(found.value.status||''); setSortBy(found.value.sortBy||'first_name'); setSortDir(found.value.sortDir||'asc');
            }
          }} sx={{ minWidth: 160 }}>
            <MenuItem value="">(none)</MenuItem>
            {(JSON.parse(localStorage.getItem('presets:members')||'[]') as Array<{name:string}>).map(p=> (<MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>))}
          </TextField>
          <Button size="small" onClick={()=>{
            const name = window.prompt('Save current filters as preset name');
            if (!name) return;
            const raw = localStorage.getItem('presets:members');
            const list = raw ? JSON.parse(raw) as Array<{name:string; value:any}> : [];
            const value = { q, status, sortBy, sortDir };
            const next = [...list.filter(p=>p.name!==name), { name, value }];
            localStorage.setItem('presets:members', JSON.stringify(next));
            setPreset(name);
          }}>Save preset</Button>
          {preset && <Button size="small" color="error" onClick={()=>{
            const raw = localStorage.getItem('presets:members');
            const list = raw ? JSON.parse(raw) as Array<{name:string; value:any}> : [];
            const next = list.filter(p=>p.name!==preset); localStorage.setItem('presets:members', JSON.stringify(next)); setPreset('');
          }}>Delete preset</Button>}
          <Button variant="outlined" onClick={()=> exportMembersCSV(data)}>Export CSV</Button>
          <Button data-testid="members-create" variant="contained" onClick={()=>setOpenCreate(true)}>Create Member</Button>
        </Stack>
      </Stack>
      <Card>
        <CardContent>
          {!membersQ.data ? <SkeletonTable rows={6}/> : (
            data.length === 0 ? <EmptyState title="No members found" subtitle="Try adjusting your filters"/> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={sortBy==='first_name'?sortDir:false as any}>
                      <TableSortLabel active={sortBy==='first_name'} direction={sortBy==='first_name'?sortDir:'asc'} onClick={()=>{ setSortBy('first_name'); setSortDir(sortDir==='asc'?'desc':'asc'); }}>First</TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={sortBy==='last_name'?sortDir:false as any}>
                      <TableSortLabel active={sortBy==='last_name'} direction={sortBy==='last_name'?sortDir:'asc'} onClick={()=>{ setSortBy('last_name'); setSortDir(sortDir==='asc'?'desc':'asc'); }}>Last</TableSortLabel>
                    </TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell sortDirection={sortBy==='status'?sortDir:false as any}>
                      <TableSortLabel active={sortBy==='status'} direction={sortBy==='status'?sortDir:'asc'} onClick={()=>{ setSortBy('status'); setSortDir(sortDir==='asc'?'desc':'asc'); }}>Status</TableSortLabel>
                    </TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((m) => (
                    <TableRow key={m.name} hover data-testid={`member-row-${m.name}`}>
                      <TableCell>{m.first_name}</TableCell>
                      <TableCell>{m.last_name}</TableCell>
                      <TableCell>{m.phone || "-"}</TableCell>
                      <TableCell>{m.status || "-"}</TableCell>
                      <TableCell>{m.email || "-"}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e)=> setMenuAnchor({ el: e.currentTarget, row: m })} aria-label="more"><MoreVertIcon fontSize="small"/></IconButton>
                        <IconButton size="small" onClick={()=>setMemberDialog({ open: true, name: m.name })} title="Open"><OpenInNewIcon fontSize="small"/></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button disabled={page===0} onClick={()=>setPage((p)=>Math.max(0,p-1))}>Prev</Button>
        <Button onClick={()=>setPage((p)=>p+1)}>Next</Button>
      </Stack>

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

  {/* Detail dialog */}
  <MemberDialog state={memberDialog} onClose={()=>setMemberDialog({ open:false })} />
  {/* Row actions menu */}
  <Menu open={!!menuAnchor.el} anchorEl={menuAnchor.el} onClose={()=> setMenuAnchor({ el: null })}>
    <MenuItem onClick={()=>{ setMemberDialog({ open: true, name: menuAnchor.row!.name }); setMenuAnchor({ el: null }); }}>
      <ListItemIcon><OpenInNewIcon fontSize="small"/></ListItemIcon>Open
    </MenuItem>
    <MenuItem onClick={()=>{ navigate(`/payments?q=${encodeURIComponent(menuAnchor.row!.name)}`); setMenuAnchor({ el: null }); }}>
      <ListItemIcon><PaymentsIcon fontSize="small"/></ListItemIcon>View payments
    </MenuItem>
    <MenuItem disabled={!menuAnchor.row?.email} onClick={()=>{ setTodo({ open: true, email: menuAnchor.row?.email, subject: "" }); setMenuAnchor({ el: null }); }}>
      <ListItemIcon><AssignmentIcon fontSize="small"/></ListItemIcon>Create ToDo
    </MenuItem>
    <MenuItem
      onClick={async ()=>{
        try {
          const res = await ensureSystemUserForMember(menuAnchor.row!.name);
          let message = `System user ready (${res.user})`;
          if (res.temp_password) {
            message += ` — temp password: ${res.temp_password}`;
            try {
              await navigator.clipboard.writeText(res.temp_password);
              message += " (copied to clipboard)";
            } catch {
              // Clipboard may be unavailable in some environments; ignore silently.
            }
          }
          toast.success(message);
        } catch (err: any) {
          console.error(err);
          toast.error(err?.response?.data?.message || "Failed to promote member");
        } finally {
          setMenuAnchor({ el: null });
        }
      }}
    >
      <ListItemIcon><BoltIcon fontSize="small"/></ListItemIcon>Promote to System User
    </MenuItem>
    <MenuItem onClick={async ()=>{ const email = menuAnchor.row?.email || menuAnchor.row?.name; await createProcess({ title: `Volunteer Request - ${email}` }); setMenuAnchor({ el: null }); }}>
      <ListItemIcon><BoltIcon fontSize="small"/></ListItemIcon>Start Volunteer Request
    </MenuItem>
  </Menu>
  {/* ToDo dialog */}
  <Drawer anchor="right" open={todo.open} onClose={()=> setTodo({ open: false, subject: "" })}>
    <Box sx={{ width: 360, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Create ToDo</Typography>
      <Stack spacing={2}>
        <TextField label="Allocated to (email)" value={todo.email || ''} onChange={(e)=> setTodo({ ...todo, email: e.target.value })} />
        <TextField label="Subject" value={todo.subject} onChange={(e)=> setTodo({ ...todo, subject: e.target.value })} />
        <TextField label="Due date" type="date" InputLabelProps={{ shrink: true }} value={todo.due || ''} onChange={(e)=> setTodo({ ...todo, due: e.target.value })} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={!todo.email || !todo.subject} onClick={async ()=>{ await createToDo({ allocated_to: todo.email!, description: todo.subject, date: todo.due }); setTodo({ open: false, subject: '' }); }}>Create</Button>
          <Button onClick={()=> setTodo({ open: false, subject: '' })}>Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  </Drawer>
</Stack>
  );
}

import Box from "@mui/material/Box";
// removed duplicate React import

function MemberDialog({ state, onClose }: { state: { open: boolean; name?: string }; onClose: ()=>void }) {
  const navigate = useNavigate();
  const meQ = useQuery({ queryKey: ["me-member-inline"], queryFn: getMyMember });
  const q = useQuery({
    queryKey: ["member-dialog", state.name],
    queryFn: () => getDoc<any>("Member", state.name!, ["name","first_name","last_name","email","phone","status"]),
    enabled: !!state.open && !!state.name,
  });
  const m = q.data || {};
  const qc = useQueryClient();
  const [patch, setPatch] = useState<{ phone?: string; status?: string }>({});
  useEffect(()=>{ if (m.name) setPatch({ phone: m.phone || '', status: m.status || '' }); }, [m.name]);
  const saveMu = useMutation({
    mutationFn: () => updateDoc("Member", m.name, patch as any),
    onSuccess: ()=>{
      toast.success('Member updated');
      qc.invalidateQueries({ queryKey: ["members"] });
      q.refetch();
    },
    onError: ()=> toast.error('Failed to update member')
  });

  const handleOpenFull = () => {
    if (!m.name) return;
    navigate(`/members/${encodeURIComponent(m.name)}`);
    onClose();
  };

  const handleMyProfile = () => {
    onClose();
    navigate('/membership');
  };

  return (
    <Dialog open={state.open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Member</DialogTitle>
      <DialogContent dividers>
        {!q.data ? (
          <SkeletonTable rows={5}/>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2">ID: {m.name}</Typography>
            <Typography variant="body2">Name: {m.first_name} {m.last_name}</Typography>
            <Typography variant="body2">Email: {m.email || "-"}</Typography>
            <TextField label="Phone" size="small" value={patch.phone || ''} onChange={(e)=> setPatch({ ...patch, phone: e.target.value })} />
            <TextField label="Status" size="small" select value={patch.status || ''} onChange={(e)=> setPatch({ ...patch, status: String(e.target.value) })}>
              {['Active','Pending','Inactive'].map(s=> (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {meQ.data?.name && meQ.data.name === m.name && (
          <Button onClick={handleMyProfile}>My Profile</Button>
        )}
        <Button onClick={handleOpenFull} disabled={!m.name}>Open Full</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon/>}
          onClick={()=> saveMu.mutate()}
          disabled={!m.name || saveMu.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function exportMembersCSV(rows: Row[]) {
  const header = ["name","first_name","last_name","phone","status","email"];
  const lines = [header.join(","), ...rows.map((r)=> header.map((h)=> (r as any)[h] ?? "").toString()).map((line)=> line)];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `members.csv`;
  a.click();
}
