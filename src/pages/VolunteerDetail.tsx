import * as React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, listToDosFor, createToDo, updateToDo, getMemberByEmail, ensureSystemUserForMember, createMember, updateVolunteer } from "@/lib/api";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

export default function VolunteerDetail() {
  const { volunteerId } = useParams();
  const qc = useQueryClient();

  const vq = useQuery({
    queryKey: ["volunteer", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      const { data } = await api.get(
        `/resource/Volunteer/${encodeURIComponent(volunteerId!)}`,
        { params: { fields: JSON.stringify(["name","member","group","services"]) }, __skipAuthRedirect: true } as any
      );
      return data.data as any;
    },
    staleTime: 60_000,
  });

  const groupsQ = useQuery({
    queryKey: ["volunteer-groups"],
    queryFn: async () => {
      const { data } = await api.get(
        `/resource/Volunteer%20Group`,
        { params: { fields: JSON.stringify(["group_name"]) , limit_page_length: 999 }, __skipAuthRedirect: true } as any
      );
      return (data.data as any[]).map((g: any) => g.group_name);
    },
    staleTime: 5 * 60_000,
  });

  const mu = useMutation({
    mutationFn: async (patch: any) => {
      return (await api.put(`/resource/Volunteer/${encodeURIComponent(volunteerId!)}`, patch)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volunteer", volunteerId] }),
  });

  const [tab, setTab] = React.useState(0);
  if (vq.isLoading) return <Card sx={{ m: 2 }}><CardHeader title="Loading volunteer…" /></Card>;
  if (!vq.data) return (
    <Card sx={{ m: 2 }}>
      <CardHeader title="Volunteer not found" />
      <CardContent>
        <Button component={RouterLink} to="/volunteers">Back</Button>
      </CardContent>
    </Card>
  );

  const v = vq.data as any;

  return (
    <Card sx={{ m:2 }}>
      <CardHeader title={`Volunteer: ${v.name}`} subheader={<Stack direction="row" spacing={1}><Chip label={v.group || "No group"}/></Stack>} />
      <CardContent>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb:2 }}>
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="History" />
          <Tab label="Membership" />
        </Tabs>

        {tab===0 && (
          <Stack spacing={2} maxWidth={500}>
            <TextField
              select
              label="Group"
              value={v.group || ""}
              onChange={(e)=>mu.mutate({ group: e.target.value })}
              helperText="Assign a volunteer group"
            >
              {(groupsQ.data || []).map((g:string)=> (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Services"
              value={v.services || ""}
              onChange={(e)=>mu.mutate({ services: e.target.value })}
              multiline
            />
            <Divider/>
            <Stack direction="row" spacing={2}>
              <Button component={RouterLink} to={v.member ? `/members/${encodeURIComponent(v.member)}` : "/members"} variant="outlined" disabled={!v.member}>Open Member</Button>
              <Button component={RouterLink} to="/volunteers" variant="text">Back</Button>
            </Stack>
          </Stack>
        )}

        {tab===1 && <VolunteerTasks volunteer={v} />}
        {tab===2 && <VolunteerHistory volunteer={v} />}
        {tab===3 && <VolunteerMembership volunteer={v} />}
      </CardContent>
    </Card>
  );
}

function VolunteerTasks({ volunteer }: { volunteer: any }) {
  const [desc, setDesc] = React.useState("");
  const [email, setEmail] = React.useState<string | null>(null);
  const qc = useQueryClient();
  React.useEffect(() => {
    (async () => {
      if (!volunteer?.member) return;
      const m = await getMemberByEmail(volunteer.member);
      setEmail(m?.email || null);
    })();
  }, [volunteer?.member]);
  const q = useQuery({
    queryKey: ["todos", email],
    queryFn: () => listToDosFor(email!, 20),
    enabled: !!email,
  });
  const muCreate = useMutation({
    mutationFn: () => createToDo({ allocated_to: email!, description: desc }),
    onSuccess: () => { setDesc(""); qc.invalidateQueries({ queryKey: ["todos", email] }); }
  });
  const muClose = useMutation({
    mutationFn: (name: string) => updateToDo(name, "Closed"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", email] })
  });
  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="New task" value={desc} onChange={(e)=>setDesc(e.target.value)} sx={{ flex: 1 }} />
        <Button variant="contained" disabled={!email || !desc} onClick={()=>muCreate.mutate()}>Assign</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow><TableCell>Description</TableCell><TableCell>Status</TableCell><TableCell width={80}></TableCell></TableRow>
        </TableHead>
        <TableBody>
          {(q.data || []).map((t:any)=>(
            <TableRow key={t.name}>
              <TableCell>{t.description}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell><Button size="small" onClick={()=>muClose.mutate(t.name)}>Close</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function VolunteerHistory({ volunteer }: { volunteer: any }) {
  const [email, setEmail] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    (async () => {
      if (!volunteer?.member) return;
      const m = await getMemberByEmail(volunteer.member);
      setEmail(m?.email || undefined);
    })();
  }, [volunteer?.member]);
  const q = useQuery({
    queryKey: ["history", email],
    queryFn: async () => (await api.get("/method/salitemiret.api.volunteer.list_workflow_history", { params: { member_email: email }, __skipAuthRedirect: true } as any)).data.message,
    enabled: true,
  });
  return (
    <Stack spacing={1}>
      {(q.data || []).map((row:any)=> (
        <Card key={row.name} variant="outlined">
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Box>{row.workflow_process} — {row.from_step} → {row.to_step}</Box>
              <Box sx={{ color: "text.secondary" }}>{row.actor} • {new Date(row.modified).toLocaleString()}</Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function VolunteerMembership({ volunteer }: { volunteer: any }) {
  const [form, setForm] = React.useState({ first_name: "", last_name: "", email: "", phone: "" });
  const hasMember = !!volunteer?.member;
  const qc = useQueryClient();
  const muCreateMember = useMutation({
    mutationFn: async () => {
      const m = await createMember(form);
      await updateVolunteer(volunteer.name, { member: m.name } as any);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volunteer", volunteer.name] })
  });
  const muEnsureUser = useMutation({
    mutationFn: () => ensureSystemUserForMember(volunteer.member),
  });
  if (hasMember) {
    return (
      <Stack spacing={2} maxWidth={560}>
        <Alert severity="info">Linked Member: {volunteer.member}</Alert>
        <Stack direction="row" spacing={2}>
          <Button component={RouterLink} to={`/members/${encodeURIComponent(volunteer.member)}`} variant="outlined">Open Member</Button>
          <Button variant="contained" onClick={()=>muEnsureUser.mutate()}>Create System User</Button>
        </Stack>
      </Stack>
    );
  }
  return (
    <Stack spacing={2} maxWidth={560}>
      <Alert severity="warning">No Member linked. Create and link.</Alert>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField label="First name" value={form.first_name} onChange={(e)=>setForm({...form, first_name:e.target.value})} sx={{ flex: 1 }}/>
        <TextField label="Last name" value={form.last_name} onChange={(e)=>setForm({...form, last_name:e.target.value})} sx={{ flex: 1 }}/>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField label="Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} sx={{ flex: 1 }}/>
        <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} sx={{ flex: 1 }}/>
      </Stack>
      <Button variant="contained" onClick={()=>muCreateMember.mutate()} disabled={!form.first_name || !form.last_name || !form.email}>Create Member and Link</Button>
    </Stack>
  );
}
