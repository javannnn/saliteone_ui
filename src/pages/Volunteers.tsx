import { useMemo, useState } from "react";
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

  const isVolunteerAdmin = useMemo(
    () => (roles || []).some((r) => r === "Admin" || r === "Volunteer Admin"),
    [roles]
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
    queryFn: () => listVolunteers(),
    enabled: isVolunteerAdmin,
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
          myEmail={user!.name}
          onSave={handleSaveSelf}
          todos={todosQ.data || []}
        />
      )}
    </Stack>
  );
}
