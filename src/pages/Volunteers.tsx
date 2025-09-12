import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Groups";
import SaveIcon from "@mui/icons-material/Save";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DeleteIcon from "@mui/icons-material/Delete";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";

import { useAuth } from "@/stores/auth";
import {
  whoami,
  getMemberByEmail,
  getVolunteerByMember, createVolunteer, updateVolunteer, deleteVolunteer,
  listVolunteerGroups, createVolunteerGroup, updateVolunteerGroup, deleteVolunteerGroup,
  listVolunteers, listMyToDos, type Volunteer, type VolunteerGroup
} from "@/lib/api";
import { toast } from "sonner";

function AssignTaskButton({ volunteer }: { volunteer: Volunteer }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [refType, setRefType] = useState("");
  const [refName, setRefName] = useState("");
  const [email, setEmail] = useState<string>("");
  const qc = useQueryClient();

  // fetch member email on open
  useEffect(() => {
    if (open && volunteer.member) {
      (async () => {
        try {
          const m = await getDoc<any>("Member", volunteer.member, ["email"]);
          setEmail(m?.email || "");
        } catch { setEmail(""); }
      })();
    }
  }, [open, volunteer.member]);

  const mAssign = useMutation({
    mutationFn: async () => {
      if (!email || !desc.trim()) throw new Error("Missing email or description");
      await createToDo({ allocated_to: email, description: desc.trim(), reference_type: refType || undefined, reference_name: refName || undefined });
    },
    onSuccess: () => { toast.success("Task assigned"); setOpen(false); setDesc(""); setRefType(""); setRefName(""); },
    onError: e => toast.error(extractErr(e))
  });

  return (
    <>
      <Button size="small" startIcon={<AssignmentIcon/>} onClick={()=>setOpen(true)}>Assign</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Task</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="Assign to (email)" value={email} InputProps={{ readOnly: true }} />
            <TextField label="Description" value={desc} onChange={e=>setDesc(e.target.value)} multiline minRows={2} />
            <Stack direction="row" spacing={1}>
              <TextField label="Reference Type" value={refType} onChange={e=>setRefType(e.target.value)} placeholder="Service Request" />
              <TextField label="Reference Name" value={refName} onChange={e=>setRefName(e.target.value)} placeholder="SR-..." />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon/>} disabled={!desc.trim() || mAssign.isPending} onClick={()=>mAssign.mutate()}>Assign</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function Volunteers() {
  const { roles, user } = useAuth();
  const isAdmin = roles?.includes("Admin") || roles?.includes("Volunteer Admin") || roles?.includes("User Management Admin");
  return isAdmin ? <VolunteerAdmin /> : <VolunteerSelfService />;
}

function VolunteerSelfService() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const qWho = useQuery({ queryKey: ["me","who"], queryFn: whoami });
  const email = qWho.data?.user || user?.name || "";

  const qMember = useQuery({
    queryKey: ["member","byEmail", email],
    queryFn: () => getMemberByEmail(email),
    enabled: !!email
  });

  const memberName = qMember.data?.name || "";

  const qVolunteer = useQuery({
    queryKey: ["volunteer","byMember", memberName],
    queryFn: () => getVolunteerByMember(memberName),
    enabled: !!memberName
  });

  const qGroups = useQuery({ queryKey: ["volunteer_groups"], queryFn: listVolunteerGroups });

  const [services, setServices] = useState("");
  const [group, setGroup] = useState("");
  useEffect(() => {
    if (qVolunteer.data) {
      setServices(qVolunteer.data.services || "");
      setGroup(qVolunteer.data.group || "");
    }
  }, [qVolunteer.data?.name]);

  const mCreate = useMutation({
    mutationFn: () => createVolunteer({ member: memberName, group, services }),
    onSuccess: () => { toast.success("Volunteer profile created"); qc.invalidateQueries({ queryKey: ["volunteer","byMember", memberName] }); },
    onError: e => toast.error(extractErr(e))
  });

  const mUpdate = useMutation({
    mutationFn: () => updateVolunteer(qVolunteer.data!.name, { services, group }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["volunteer","byMember", memberName] }); },
    onError: e => toast.error(extractErr(e))
  });

  const qToDos = useQuery({
    queryKey: ["todos","me", email],
    queryFn: async () => {
      if (!email) return [];
      return listToDosFor(email, 20);
    },
    enabled: !!email
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: (t)=>`1px solid ${t.palette.divider}` }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: .5 }}>Volunteer Workspace</Typography>
        <Typography color="text.secondary">Manage your profile and see your open tasks.</Typography>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: (t)=>`1px solid ${t.palette.divider}` }}>
            <Typography variant="overline" color="text.secondary">My Volunteer Profile</Typography>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <TextField label="Member" value={qMember.isLoading ? "" : (qMember.data?.name || "Not linked")} InputProps={{ readOnly:true }} />
              <TextField label="Group" value={group} onChange={e=>setGroup(e.target.value)} placeholder="e.g. Event Support" />
              <TextField label="Services / Skills" value={services} onChange={e=>setServices(e.target.value)} placeholder="First aid, ushering, media, transport…" multiline minRows={3} />
              <Stack direction="row" spacing={1}>
                {!qVolunteer.data ? (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={()=>mCreate.mutate()} disabled={!memberName || mCreate.isPending}>Create Profile</Button>
                ) : (
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={()=>mUpdate.mutate()} disabled={mUpdate.isPending}>Save</Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: (t)=>`1px solid ${t.palette.divider}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="overline" color="text.secondary">My Open Tasks</Typography>
              <Chip icon={<AssignmentIcon />} label="ToDo" size="small" />
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              {qToDos.isLoading && (<><Skeleton height={28}/><Skeleton height={28}/><Skeleton height={28}/></>)}
              {qToDos.data?.map(t=> (
                <Stack key={t.name} direction="row" spacing={1}>
                  <Typography sx={{ fontWeight: 600 }}>{t.description || t.reference_name || t.name}</Typography>
                  <Box sx={{ flex:1 }}/>
                  <Typography variant="body2" color="text.secondary">{t.reference_type || ""}</Typography>
                </Stack>
              ))}
              {qToDos.data && qToDos.data.length === 0 && <Typography color="text.secondary">No open tasks.</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">Tip: Admins can assign you tasks via ToDo linked to “Service Request”.</Typography>
      </Box>
    </Container>
  );
}

function VolunteerAdmin() {
  const qc = useQueryClient();
  const qVols = useQuery({ queryKey: ["volunteers"], queryFn: listVolunteers });
  const qGroups = useQuery({ queryKey: ["volunteer_groups"], queryFn: listVolunteerGroups });

  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    (qVols.data||[]).forEach(v => { if (v.group) map.set(v.group, (map.get(v.group)||0)+1); });
    return map;
  }, [qVols.data]);

  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgEditing, setDlgEditing] = useState<VolunteerGroup|null>(null);
  const [dlgName, setDlgName] = useState("");
  const [dlgLeader, setDlgLeader] = useState("");
  const [dlgDesc, setDlgDesc] = useState("");

  const openNew = () => { setDlgEditing(null); setDlgName(""); setDlgLeader(""); setDlgDesc(""); setDlgOpen(true); };
  const openEdit = (g:VolunteerGroup) => { setDlgEditing(g); setDlgName(g.group_name); setDlgLeader(g.leader||""); setDlgDesc(g.description||""); setDlgOpen(true); };

  const mGroupSave = useMutation({
    mutationFn: async () => {
      if (dlgEditing) return updateVolunteerGroup(dlgEditing.name, { group_name: dlgName, leader: dlgLeader, description: dlgDesc });
      return createVolunteerGroup({ group_name: dlgName, leader: dlgLeader, description: dlgDesc });
    },
    onSuccess: () => { toast.success("Group saved"); setDlgOpen(false); qc.invalidateQueries({ queryKey:["volunteer_groups"] }); },
    onError: e => toast.error(extractErr(e))
  });

  const mGroupDelete = useMutation({
    mutationFn: (name:string) => deleteVolunteerGroup(name),
    onSuccess: () => { toast.success("Group deleted"); qc.invalidateQueries({ queryKey:["volunteer_groups"] }); },
    onError: e => toast.error(extractErr(e))
  });

  const mUpdateVol = useMutation({
    mutationFn: ({ id, patch }:{id:string, patch:Partial<Volunteer>}) => updateVolunteer(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["volunteers"] }); toast.success("Updated"); },
    onError: e => toast.error(extractErr(e))
  });

  const mDeleteVol = useMutation({
    mutationFn: (id:string) => deleteVolunteer(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["volunteers"] }); toast.success("Deleted"); },
    onError: e => toast.error(extractErr(e))
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: (t)=>`1px solid ${t.palette.divider}` }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: .5 }}>Volunteer Administration</Typography>
        <Typography color="text.secondary">Manage groups, assign volunteers, and edit skills.</Typography>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: (t)=>`1px solid ${t.palette.divider}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="overline" color="text.secondary">Volunteer Groups</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openNew}>New Group</Button>
            </Stack>
            <Divider sx={{ my: 1.5 }}/>
            <Stack spacing={1.25}>
              {qGroups.isLoading && (<><Skeleton height={28}/><Skeleton height={28}/><Skeleton height={28}/></>)}
              {qGroups.data?.map(g=> (
                <Stack key={g.name} direction="row" alignItems="center" spacing={1}>
                  <GroupIcon fontSize="small" />
                  <Typography sx={{ fontWeight: 600 }}>{g.group_name}</Typography>
                  <Chip size="small" label={`${groupCounts.get(g.group_name) || 0}`} />
                  <Box sx={{ flex:1 }}/>
                  <Button size="small" onClick={()=>openEdit(g)}>Edit</Button>
                  <Button size="small" color="error" startIcon={<DeleteIcon/>} onClick={()=>mGroupDelete.mutate(g.name)}>Delete</Button>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 1.5, border: (t)=>`1px solid ${t.palette.divider}` }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell>Services</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(qVols.data||[]).map((v)=> (
                    <TableRow key={v.name} hover>
                      <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</TableCell>
                      <TableCell>{v.member}</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Select
                          size="small"
                          displayEmpty
                          defaultValue={v.group || ""}
                          onChange={(e)=>{
                            const val = e.target.value as string;
                            if (val !== (v.group||"")) mUpdateVol.mutate({ id: v.name, patch: { group: val } });
                          }}
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {(qGroups.data||[]).map(g => (
                            <MenuItem key={g.name} value={g.group_name}>{g.group_name}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 240 }}>
                        <TextField
                          size="small"
                          defaultValue={v.services || ""}
                          onBlur={(e)=>{
                            const val = e.target.value;
                            if (val !== (v.services||"")) mUpdateVol.mutate({ id: v.name, patch: { services: val } });
                          }}
                          multiline minRows={1}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <AssignTaskButton volunteer={v} />
                        <IconButton color="error" onClick={()=>mDeleteVol.mutate(v.name)} title="Delete"><DeleteIcon/></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dlgOpen} onClose={()=>setDlgOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dlgEditing ? "Edit Group" : "New Group"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="Group Name" value={dlgName} onChange={e=>setDlgName(e.target.value)} />
            <TextField label="Leader (Member ID)" value={dlgLeader} onChange={e=>setDlgLeader(e.target.value)} />
            <TextField label="Description" value={dlgDesc} onChange={e=>setDlgDesc(e.target.value)} multiline minRows={2}/>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDlgOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon/>} onClick={()=>mGroupSave.mutate()} disabled={!dlgName || mGroupSave.isPending}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function extractErr(e:any) {
  return e?.response?.data?.message || e?.response?.data?.exc || e?.message || "Error";
}
import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddTaskIcon from "@mui/icons-material/AddTask";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import { useAuth } from "@/stores/auth";
import {
  listVolunteerGroups,
  listVolunteers,
  getMemberByEmail,
  getVolunteerByMember,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  listToDosFor,
  createToDo,
} from "@/lib/api";

function AdminTable({
  groups,
  volunteers,
  onUpdate,
  onDelete,
  onAssignTask,
}: {
  groups: Array<{ name: string; group_name?: string }>;
  volunteers: Array<{ name: string; member: string; group?: string; services?: string; email?: string }>;
  onUpdate: (row: any) => void;
  onDelete: (name: string) => void;
  onAssignTask: (email: string) => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Volunteers</Typography>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
          <Box component="thead">
            <Box component="tr" sx={{ "& th": { textAlign: "left", py: 1, borderBottom: "1px solid #333" } }}>
              <Box component="th">Member</Box>
              <Box component="th">Email</Box>
              <Box component="th">Group</Box>
              <Box component="th">Services</Box>
              <Box component="th" />
            </Box>
          </Box>
          <Box component="tbody">
            {volunteers.map((v) => (
              <Box component="tr" key={v.name} sx={{ "& td": { py: 1, borderBottom: "1px solid #222" } }}>
                <Box component="td">{v.member}</Box>
                <Box component="td">{v.email || "-"}</Box>
                <Box component="td" sx={{ minWidth: 220 }}>
                  <TextField
                    size="small"
                    select
                    value={v.group || ""}
                    onChange={(e) => onUpdate({ ...v, group: e.target.value })}
                    fullWidth
                  >
                    {groups.map((g) => (
                      <MenuItem key={g.name} value={g.group_name || g.name}>
                        {g.group_name || g.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box component="td" sx={{ minWidth: 320 }}>
                  <TextField
                    size="small"
                    value={v.services || ""}
                    onChange={(e) => onUpdate({ ...v, services: e.target.value })}
                    placeholder="Ushering, Logistics"
                    fullWidth
                  />
                </Box>
                <Box component="td" sx={{ whiteSpace: "nowrap" }}>
                  <Button
                    size="small"
                    startIcon={<AddTaskIcon />}
                    onClick={() => v.email && onAssignTask(v.email)}
                    sx={{ mr: 1 }}
                  >
                    Assign task
                  </Button>
                  <IconButton color="error" onClick={() => onDelete(v.name)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function VolunteerSelfService({
  groups,
  myVolunteer,
  myEmail,
  onSave,
  todos,
}: {
  groups: Array<{ name: string; group_name?: string }>;
  myVolunteer: { name?: string; group?: string; services?: string } | null;
  myEmail: string;
  onSave: (payload: { name?: string; group?: string; services?: string }) => void;
  todos: Array<{ name: string; description: string }>;
}) {
  const [group, setGroup] = useState(myVolunteer?.group || "");
  const [services, setServices] = useState(myVolunteer?.services || "");

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {myVolunteer?.name ? "Your Volunteer Profile" : "Create Volunteer Profile"}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              sx={{ minWidth: 240 }}
            >
              {groups.map((g) => (
                <MenuItem key={g.name} value={g.group_name || g.name}>
                  {g.group_name || g.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Services"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="Ushering, Logistics"
              sx={{ flex: 1, minWidth: 280 }}
            />
            <Button
              variant="contained"
              onClick={() => onSave({ name: myVolunteer?.name, group, services })}
            >
              {myVolunteer?.name ? "Save" : "Create"}
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            Linked email: {myEmail}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>My Open Tasks</Typography>
          {todos.length === 0 ? (
            <Typography color="text.secondary">No open tasks.</Typography>
          ) : (
            <List dense>
              {todos.map((t) => (
                <ListItem key={t.name} disableGutters>
                  <ListItemText primary={t.description} />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function Volunteers() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();

  const isAdmin = useMemo(
    () => roles.some((r) => r === "Admin" || r === "User Management Admin"),
    [roles]
  );

  // HOIST ALL HOOKS. Never branch on hooks.
  const memberQ = useQuery({
    queryKey: ["member", user],
    queryFn: () => getMemberByEmail(user!),
    enabled: !!user,
    staleTime: 60_000,
  });

  const groupsQ = useQuery({
    queryKey: ["vol-groups"],
    queryFn: () => listVolunteerGroups(),
    enabled: true,
    staleTime: 60_000,
  });

  const volunteersQ = useQuery({
    queryKey: ["volunteers"],
    queryFn: () => listVolunteers(),
    enabled: isAdmin,
  });

  const myVolQ = useQuery({
    queryKey: ["my-vol", memberQ.data?.name],
    queryFn: () => getVolunteerByMember(memberQ.data!.name),
    enabled: !!memberQ.data && !isAdmin,
  });

  const todosQ = useQuery({
    queryKey: ["todos", user],
    queryFn: () => listToDosFor(user!, 10),
    enabled: !!user && !isAdmin,
  });

  const createVol = useMutation({
    mutationFn: createVolunteer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-vol"] }),
  });
  const updateVol = useMutation({
    mutationFn: ({ name, ...patch }: any) => updateVolunteer(name, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-vol"] }),
  });
  const deleteVol = useMutation({
    mutationFn: (name: string) => deleteVolunteer(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volunteers"] });
      qc.invalidateQueries({ queryKey: ["my-vol"] });
    },
  });
  const assignTask = useMutation({
    mutationFn: (email: string) => createToDo({ description: "General help", allocated_to: email }),
  });

  // Lock initial mode once
  const initRef = useRef(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  if (!isAdmin && !initRef.current) {
    if (!myVolQ.data) setMode("edit");
    initRef.current = true;
  }

  const groups = groupsQ.data || [];
  const volunteers = (volunteersQ.data || []).map((v: any) => ({
    ...v,
    email: v.email || v.member_email,
  }));

  const myVolunteer = myVolQ.data || null;

  const handleSaveSelf = (payload: { name?: string; group?: string; services?: string }) => {
    if (payload.name) updateVol.mutate(payload as any);
    else createVol.mutate(payload as any);
  };

  const handleAdminUpdate = (row: any) => updateVol.mutate(row);
  const handleAdminDelete = (name: string) => deleteVol.mutate(name);
  const handleAssign = (email: string) => assignTask.mutate(email);

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Volunteers</Typography>
      <Divider />

      {isAdmin ? (
        <AdminTable
          groups={groups}
          volunteers={volunteers}
          onUpdate={handleAdminUpdate}
          onDelete={handleAdminDelete}
          onAssignTask={handleAssign}
        />
      ) : (
        <VolunteerSelfService
          groups={groups}
          myVolunteer={myVolunteer}
          myEmail={user!}
          onSave={handleSaveSelf}
          todos={todosQ.data || []}
        />
      )}
    </Stack>
  );
}
