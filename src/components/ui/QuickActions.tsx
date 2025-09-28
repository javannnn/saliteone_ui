import { useState } from "react";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAddAlt1";
import CampaignIcon from "@mui/icons-material/Campaign";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import { adminCreateMember, createMediaRequest, createServiceLog, createToDo, getMemberByEmail, createProcess } from "@/lib/api";

export default function QuickActions() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (roles||[]).some(r=> r === 'Admin' || r === 'System Manager');
  const isVolunteer = (roles||[]).includes('Volunteer');
  const [open, setOpen] = useState(false);
  const [dlg, setDlg] = useState<null | 'member' | 'media' | 'todo' | 'service' | 'vreq'>(null);
  const [form, setForm] = useState<any>({});

  const actions = [
    ...(isAdmin ? [{ icon: <PersonAddIcon />, name: 'New Member', key: 'member' as const }] : []),
    { icon: <CampaignIcon />, name: 'Media Request', key: 'media' as const },
    { icon: <PlaylistAddCheckIcon />, name: 'Create ToDo', key: 'todo' as const },
    ...(isVolunteer ? [{ icon: <WorkHistoryIcon />, name: 'Log Service', key: 'service' as const }] : []),
    { icon: <AddIcon />, name: 'Volunteer Request', key: 'vreq' as const },
  ];

  async function submit() {
    try {
      if (dlg === 'member') {
        const { first_name, last_name, email, phone } = form;
        await adminCreateMember({ first_name, last_name, email, phone });
        navigate(`/members?q=${encodeURIComponent(email||first_name||'')}`);
      } else if (dlg === 'media') {
        const req = await getMemberByEmail(user!.name);
        await createMediaRequest({ requester: req?.name, title: form.title, description: form.description });
        navigate('/media');
      } else if (dlg === 'todo') {
        await createToDo({ allocated_to: form.email || user!.name, description: form.description, date: form.due_date });
        navigate('/notifications');
      } else if (dlg === 'service') {
        const me = await getMemberByEmail(user!.name);
        await createServiceLog({ member: me?.name, service_date: form.service_date, service_type: form.service_type, hours: Number(form.hours||1), notes: form.notes });
        navigate('/volunteers');
      } else if (dlg === 'vreq') {
        const email = form.email || user!.name;
        await createProcess({ title: `Volunteer Request - ${email}` });
        navigate('/approvals');
      }
    } finally {
      setDlg(null); setForm({});
    }
  }

  return (
    <>
      <Tooltip title="Quick Actions">
        <SpeedDial ariaLabel="Quick actions" icon={<SpeedDialIcon />} open={open} onOpen={()=>setOpen(true)} onClose={()=>setOpen(false)} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          {actions.map(a => (
            <SpeedDialAction key={a.key} icon={a.icon} tooltipTitle={a.name} onClick={()=>{ setDlg(a.key); setOpen(false); }} />
          ))}
        </SpeedDial>
      </Tooltip>

      <Dialog open={!!dlg} onClose={()=> setDlg(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {dlg === 'member' && 'Create Member'}
          {dlg === 'media' && 'Create Media Request'}
          {dlg === 'todo' && 'Create ToDo'}
          {dlg === 'service' && 'Log Service'}
          {dlg === 'vreq' && 'Start Volunteer Request'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {dlg === 'member' && (<>
              <TextField label="First name" value={form.first_name||''} onChange={(e)=> setForm({ ...form, first_name: e.target.value })} />
              <TextField label="Last name" value={form.last_name||''} onChange={(e)=> setForm({ ...form, last_name: e.target.value })} />
              <TextField label="Email" value={form.email||''} onChange={(e)=> setForm({ ...form, email: e.target.value })} />
              <TextField label="Phone" value={form.phone||''} onChange={(e)=> setForm({ ...form, phone: e.target.value })} />
            </>)}
            {dlg === 'media' && (<>
              <TextField label="Title" value={form.title||''} onChange={(e)=> setForm({ ...form, title: e.target.value })} />
              <TextField label="Description" value={form.description||''} onChange={(e)=> setForm({ ...form, description: e.target.value })} multiline rows={3} />
            </>)}
            {dlg === 'todo' && (<>
              <TextField label="Allocated to (email)" value={form.email||user?.name||''} onChange={(e)=> setForm({ ...form, email: e.target.value })} />
              <TextField label="Description" value={form.description||''} onChange={(e)=> setForm({ ...form, description: e.target.value })} />
              <TextField label="Due date" type="date" InputLabelProps={{ shrink: true }} value={form.due_date||''} onChange={(e)=> setForm({ ...form, due_date: e.target.value })} />
            </>)}
            {dlg === 'service' && (<>
              <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.service_date||''} onChange={(e)=> setForm({ ...form, service_date: e.target.value })} />
              <TextField label="Type" value={form.service_type||''} onChange={(e)=> setForm({ ...form, service_type: e.target.value })} />
              <TextField label="Hours" type="number" value={form.hours||1} onChange={(e)=> setForm({ ...form, hours: e.target.value })} />
              <TextField label="Notes" value={form.notes||''} onChange={(e)=> setForm({ ...form, notes: e.target.value })} />
            </>)}
            {dlg === 'vreq' && (<>
              <TextField label="Applicant email" value={form.email||user?.name||''} onChange={(e)=> setForm({ ...form, email: e.target.value })} />
            </>)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setDlg(null)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={(dlg==='member' && (!form.first_name || !form.last_name || !form.email)) || (dlg==='media' && !form.title) || (dlg==='todo' && !form.description) || (dlg==='service' && (!form.service_date || !form.service_type))}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

