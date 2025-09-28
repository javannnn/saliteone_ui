import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import SkeletonTable from "@/components/ui/SkeletonTable";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaymentsIcon from "@mui/icons-material/Payments";
import GroupIcon from "@mui/icons-material/Group";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/ui/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPendingMembers, listSubmittedServiceLogs, listPendingMediaRequests, list_volunteer_requests, approveServiceLog, rejectServiceLog, adminSetMemberStatus, api } from "@/lib/api";
import { useState } from "react";

export default function Approvals() {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement|null; row?: any }>({ el: null });
  const [tab, setTab] = useState(0);
  // persist tab in URL for shareable link
  useEffect(()=>{
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('tab');
    if (t) setTab(Number(t));
  }, []);
  useEffect(()=>{
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', String(tab));
    const search = sp.toString();
    window.history.replaceState(null, '', `?${search}`);
  }, [tab]);
  const qc = useQueryClient();
  const membersQ = useQuery({ queryKey: ["appr","members"], queryFn: () => listPendingMembers(50,0), staleTime: 10_000 });
  const logsQ = useQuery({ queryKey: ["appr","logs"], queryFn: () => listSubmittedServiceLogs(50,0), staleTime: 10_000 });
  const mediaQ = useQuery({ queryKey: ["appr","media"], queryFn: () => listPendingMediaRequests(50,0), staleTime: 10_000 });
  const vreqQ = useQuery({ queryKey: ["appr","vreq"], queryFn: async ()=> (await api.get('/method/salitemiret.api.volunteer.list_volunteer_requests')).data.message, staleTime: 10_000 });

  const approveLog = useMutation({ mutationFn: (name: string) => approveServiceLog(name), onSuccess: ()=> qc.invalidateQueries({ queryKey: ["appr","logs"] }) });
  const rejectLog = useMutation({ mutationFn: ({ name, reason }: any) => rejectServiceLog(name, reason), onSuccess: ()=> qc.invalidateQueries({ queryKey: ["appr","logs"] }) });
  const setMemberStatus = useMutation({ mutationFn: ({ name, status }: any) => adminSetMemberStatus(name, status), onSuccess: ()=> qc.invalidateQueries({ queryKey: ["appr","members"] }) });
  const approveVreq = useMutation({ mutationFn: ({ process }: any) => api.post('/method/salitemiret.api.volunteer.approve_volunteer_request', { process }), onSuccess: ()=> qc.invalidateQueries({ queryKey: ["appr","vreq"] }) });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Approvals</Typography>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 2 }}>
          <Tab label="Members" />
          <Tab label="Service Logs" />
          <Tab label="Media" />
          <Tab label="Volunteer Requests" />
        </Tabs>
        {tab===0 && (
          !membersQ.data ? <SkeletonTable /> : (membersQ.data.length===0 ? <EmptyState title="No pending members" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Action</TableCell><TableCell></TableCell></TableRow></TableHead>
              <TableBody>
                {membersQ.data.map((m:any)=> (
                  <TableRow key={m.name}><TableCell>{m.first_name} {m.last_name}</TableCell><TableCell>{m.email}</TableCell><TableCell>{m.phone||'-'}</TableCell><TableCell><Stack direction="row" spacing={1}><Button size="small" variant="contained" onClick={()=>setMemberStatus.mutate({ name: m.name, status: 'Active' })}>Activate</Button><Button size="small" color="warning" onClick={()=>setMemberStatus.mutate({ name: m.name, status: 'Pending' })}>Keep Pending</Button></Stack></TableCell><TableCell><Button size="small" href={`/members?q=${encodeURIComponent(m.name)}`}>Open</Button></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          ))
        )}
        {tab===1 && (
          !logsQ.data ? <SkeletonTable /> : (logsQ.data.length===0 ? <EmptyState title="No service logs" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Volunteer</TableCell><TableCell>Group</TableCell><TableCell>Type</TableCell><TableCell>Hours</TableCell><TableCell>Action</TableCell><TableCell></TableCell></TableRow></TableHead>
              <TableBody>
                {logsQ.data.map((r:any)=> (
                  <TableRow key={r.name}><TableCell>{r.service_date}</TableCell><TableCell>{r.volunteer}</TableCell><TableCell>{r.group}</TableCell><TableCell>{r.service_type}</TableCell><TableCell>{r.hours}</TableCell><TableCell><Stack direction="row" spacing={1}><Button size="small" variant="contained" onClick={()=>approveLog.mutate(r.name)}>Approve</Button><Button size="small" color="error" onClick={()=>rejectLog.mutate({ name: r.name })}>Reject</Button></Stack></TableCell><TableCell align="right"><IconButton size="small" onClick={(e)=> setMenuAnchor({ el: e.currentTarget, row: r })}><MoreVertIcon fontSize="small"/></IconButton></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          ))
        )}
        {tab===2 && (
          !mediaQ.data ? <SkeletonTable /> : (mediaQ.data.length===0 ? <EmptyState title="No pending media" /> : (
            <Table size="small">
            <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell>Modified</TableCell><TableCell></TableCell></TableRow></TableHead>
              <TableBody>
                {mediaQ.data.map((r:any)=> (
                  <TableRow key={r.name}><TableCell>{r.title}</TableCell><TableCell>{r.status}</TableCell><TableCell>{r.modified}</TableCell><TableCell><Button size="small" href={`/media`}>Open</Button></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          ))
        )}
        {tab===3 && (
          !vreqQ.data ? <SkeletonTable /> : (vreqQ.data.length===0 ? <EmptyState title="No volunteer requests" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell>Email</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
              <TableBody>
                {vreqQ.data.map((r:any)=> (
                  <TableRow key={r.name}><TableCell>{r.title}</TableCell><TableCell>{r.status}</TableCell><TableCell>{r.email||'-'}</TableCell><TableCell><Button size="small" variant="contained" onClick={()=>approveVreq.mutate({ process: r.name })}>Approve</Button></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          ))
        )}
      </CardContent>
      <Menu open={!!menuAnchor.el} anchorEl={menuAnchor.el} onClose={()=> setMenuAnchor({ el: null })}>
        <MenuItem onClick={()=>{ navigate('/volunteers/admin'); setMenuAnchor({ el: null }); }}>
          <ListItemIcon><OpenInNewIcon fontSize="small"/></ListItemIcon>Open Volunteers Admin
        </MenuItem>
        <MenuItem onClick={()=>{ navigate('/team/group'); setMenuAnchor({ el: null }); }}>
          <ListItemIcon><GroupIcon fontSize="small"/></ListItemIcon>Open Group Management
        </MenuItem>
        <MenuItem onClick={()=>{ const m = menuAnchor.row?.member || ''; if (m) navigate(`/payments?q=${encodeURIComponent(m)}`); setMenuAnchor({ el: null }); }}>
          <ListItemIcon><PaymentsIcon fontSize="small"/></ListItemIcon>View Member Payments
        </MenuItem>
      </Menu>
    </Card>
  );
}
