import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonTable from "@/components/ui/SkeletonTable";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listVolunteerGroups, listGroupMembers, listGroupToDos, updateToDo, assignTodoToVolunteer } from "@/lib/api";

export default function TeamTasks() {
  const qc = useQueryClient();
  const groupsQ = useQuery({ queryKey: ["tl-groups"], queryFn: () => listVolunteerGroups() });
  const [group, setGroup] = useState<string>("");
  const [volunteer, setVolunteer] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [due, setDue] = useState<string>("");
  const membersQ = useQuery({ queryKey: ["tl-members", group], queryFn: () => listGroupMembers(group), enabled: !!group });
  const todosQ = useQuery({ queryKey: ["tl-todos", group], queryFn: () => listGroupToDos(group, "Open", 200, 0), enabled: !!group });
  const closeTodo = useMutation({ mutationFn: (name: string) => updateToDo(name, "Closed"), onSuccess: () => qc.invalidateQueries({ queryKey: ["tl-todos", group] }) });
  const assign = useMutation({ mutationFn: () => assignTodoToVolunteer(volunteer, subject, due), onSuccess: () => { setSubject(""); qc.invalidateQueries({ queryKey: ["tl-todos", group] }); } });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Team Tasks</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Group" value={group} onChange={(e)=>{ setGroup(e.target.value); setVolunteer(""); }} sx={{ minWidth: 240 }}>
            {(groupsQ.data || []).map((g:any)=> (
              <MenuItem key={g.name} value={g.group_name || g.name}>{g.group_name || g.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Volunteer" value={volunteer} onChange={(e)=>setVolunteer(e.target.value)} sx={{ minWidth: 240 }} disabled={!group}>
            {(membersQ.data || []).map((m:any)=> (
              <MenuItem key={m.name} value={m.name}>{m.member}</MenuItem>
            ))}
          </TextField>
          <TextField label="Task" value={subject} onChange={(e)=>setSubject(e.target.value)} sx={{ flex: 1 }} />
          <TextField label="Due" type="date" value={due} onChange={(e)=>setDue(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" disabled={!volunteer || !subject} onClick={()=>assign.mutate()}>Assign</Button>
        </Stack>
        {!group ? <EmptyState title="Select a group" /> : !todosQ.data ? <SkeletonTable /> : (
          (todosQ.data || []).length === 0 ? <EmptyState title="No open tasks" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Description</TableCell><TableCell>Allocated To</TableCell><TableCell>Due</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
              <TableBody>
                {(todosQ.data || []).map((t:any)=> (
                  <TableRow key={t.name}>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.allocated_to}</TableCell>
                    <TableCell>{t.date || "-"}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell><Button size="small" onClick={()=>closeTodo.mutate(t.name)}>Close</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>
    </Card>
  );
}

