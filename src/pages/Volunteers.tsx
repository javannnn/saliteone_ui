import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddTaskIcon from "@mui/icons-material/AddTask";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PaymentsIcon from "@mui/icons-material/Payments";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";

import { useAuth } from "@/stores/auth";
import {
  listVolunteerGroups,
  getMemberByEmail,
  getVolunteerByMember,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  listToDosFor,
  createToDo,
} from "@/lib/api";
import { api } from "@/lib/api";

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
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement|null; row?: any }>({ el: null });
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
                  <IconButton size="small" onClick={(e)=> setMenuAnchor({ el: e.currentTarget, row: v })} aria-label="more" sx={{ mr: 1 }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
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
        <Menu open={!!menuAnchor.el} anchorEl={menuAnchor.el} onClose={()=> setMenuAnchor({ el: null })}>
          <MenuItem onClick={()=>{ window.location.href = `/members?q=${encodeURIComponent(menuAnchor.row?.member||'')}`; setMenuAnchor({ el: null }); }}>
            <ListItemIcon><OpenInNewIcon fontSize="small"/></ListItemIcon>Open Member
          </MenuItem>
          <MenuItem onClick={()=>{ window.location.href = `/payments?q=${encodeURIComponent(menuAnchor.row?.member||'')}`; setMenuAnchor({ el: null }); }}>
            <ListItemIcon><PaymentsIcon fontSize="small"/></ListItemIcon>View Payments
          </MenuItem>
          <MenuItem disabled={!menuAnchor.row?.email} onClick={()=>{ onAssignTask(menuAnchor.row?.email); setMenuAnchor({ el: null }); }}>
            <ListItemIcon><AssignmentIcon fontSize="small"/></ListItemIcon>Create ToDo
          </MenuItem>
        </Menu>
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
  const { pathname } = useLocation();

  const forcedAdmin = pathname.endsWith("/admin");
  const isVolunteerAdmin = useMemo(
    () => forcedAdmin || (roles || []).some((r) => r === "Admin" || r === "Volunteer Admin"),
    [roles, forcedAdmin]
  );

  // Stable hook order
  const memberQ = useQuery({
    queryKey: ["member", user],
    queryFn: () => getMemberByEmail(user!.name),
    enabled: !!user?.name,
    staleTime: 60_000,
  });

  const groupsQ = useQuery({
    queryKey: ["vol-groups"],
    queryFn: () => listVolunteerGroups(),
    enabled: !!user?.name,
    staleTime: 60_000,
  });

  const volunteersQ = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data } = await api.get("/method/salitemiret.api.volunteer.list_volunteers");
      return data?.message ?? data;
    },
    enabled: isVolunteerAdmin,
  });

  const requestsQ = useQuery({
    queryKey: ["vol-requests"],
    queryFn: async () => (await api.get("/method/salitemiret.api.volunteer.list_volunteer_requests")).data.message,
    enabled: isVolunteerAdmin,
    staleTime: 10_000,
  });

  const approveReq = useMutation({
    mutationFn: async (process: string) => (await api.post("/method/salitemiret.api.volunteer.approve_volunteer_request", { process, create_user: 0 })).data.message,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vol-requests"] }); qc.invalidateQueries({ queryKey: ["volunteers"] }); }
  });
  const promoteMember = useMutation({
    mutationFn: async (member: string) => (await api.post("/method/salitemiret.api.auth.ensure_system_user_for_member", { member })).data.message,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vol-requests"] })
  });
  const genTempPwd = useMutation({
    mutationFn: async (member: string) => (await api.post("/method/salitemiret.api.volunteer.generate_member_temp_password", { member })).data.message,
  });

  const myVolQ = useQuery({
    queryKey: ["my-vol", memberQ.data?.name],
    queryFn: () => getVolunteerByMember(memberQ.data!.name),
    enabled: !!memberQ.data && !isVolunteerAdmin,
  });

  const todosQ = useQuery({
    queryKey: ["todos", user],
    queryFn: () => listToDosFor(user!.name, 10),
    enabled: !!user?.name && !isVolunteerAdmin,
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

  // No render-time mode switching; self-service handles create vs update

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

  const [tab, setTab] = useState(0);
  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Volunteers</Typography>
        {isVolunteerAdmin && (
          <Button variant="outlined" href="/volunteers/bulk-upload">Bulk Upload</Button>
        )}
      </Stack>
      <Divider />

      {isVolunteerAdmin ? (
        <>
          <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 1 }}>
            <Tab label="Volunteers" />
            <Tab label="Requests" />
          </Tabs>
          {tab===0 && (
            <AdminTable
              groups={groups}
              volunteers={volunteers}
              onUpdate={handleAdminUpdate}
              onDelete={handleAdminDelete}
              onAssignTask={handleAssign}
            />
          )}
          {tab===1 && (
            <Card variant="outlined">
              <CardHeader title="Volunteer Requests" subheader="Approve requests and optionally provision login" />
              <CardContent>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell>Email</TableCell><TableCell>Member</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(requestsQ.data || []).map((r:any)=> (
                      <TableRow key={r.name}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.member || "-"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" onClick={async ()=>{
                              await approveReq.mutateAsync(r.name);
                            }}>Approve</Button>
                            {r.member && <Button size="small" variant="outlined" onClick={async ()=>{
                              try {
                                const res = await genTempPwd.mutateAsync(r.member);
                                if (res?.user && res?.password) {
                                  alert(`Temp credentials for ${res.user}: ${res.password}`);
                                }
                              } catch (e:any) {
                                alert(e?.response?.data?.message || e?.message || "Failed to generate");
                              }
                            }}>Generate Password</Button>}
                            {r.member && <Button size="small" onClick={async ()=>{
                              await promoteMember.mutateAsync(r.member);
                              alert("Promoted to System User");
                            }}>Promote to System User</Button>}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <VolunteerSelfService
          groups={groups}
          myVolunteer={myVolunteer}
          myEmail={user!.name}
          onSave={handleSaveSelf}
          todos={todosQ.data || []}
        />
      )}
    </Stack>
  );
}
