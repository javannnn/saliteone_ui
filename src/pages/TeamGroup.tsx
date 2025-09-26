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
import { listVolunteerGroups, listGroupMembers, assignTodoToVolunteer } from "@/lib/api";

export default function TeamGroup() {
  const qc = useQueryClient();
  const groupsQ = useQuery({ queryKey: ["tl-groups"], queryFn: () => listVolunteerGroups() });
  const [group, setGroup] = useState<string>("");
  const membersQ = useQuery({ queryKey: ["tl-members", group], queryFn: () => listGroupMembers(group), enabled: !!group });
  const [task, setTask] = useState<{ volunteer?: string; subject: string; due_date?: string }>({ subject: "" });
  const assign = useMutation({ mutationFn: ({ volunteer, subject, due_date }: any) => assignTodoToVolunteer(volunteer, subject, due_date) });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Group Management</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Group" value={group} onChange={(e)=>setGroup(e.target.value)} sx={{ minWidth: 240 }}>
            {(groupsQ.data || []).map((g:any)=> (
              <MenuItem key={g.name} value={g.group_name || g.name}>{g.group_name || g.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Task" value={task.subject} onChange={(e)=>setTask({ ...task, subject: e.target.value })} sx={{ flex: 1 }} />
          <TextField label="Due" type="date" value={task.due_date || ""} onChange={(e)=>setTask({ ...task, due_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" disabled={!task.volunteer || !task.subject} onClick={async ()=>{ await assign.mutateAsync(task); setTask({ volunteer: task.volunteer, subject: "", due_date: task.due_date }); }}>Assign</Button>
        </Stack>
        {!group ? <EmptyState title="Select a group" /> : !membersQ.data ? <SkeletonTable /> : (
          (membersQ.data || []).length === 0 ? <EmptyState title="No members in this group" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Volunteer</TableCell><TableCell>Member</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Services</TableCell><TableCell>Assign</TableCell></TableRow></TableHead>
              <TableBody>
                {(membersQ.data || []).map((m:any)=> (
                  <TableRow key={m.name}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.member}</TableCell>
                    <TableCell><a href={`mailto:${m.member_email}`}>{m.member_email}</a></TableCell>
                    <TableCell>{m.member_phone || "-"}</TableCell>
                    <TableCell>{m.services || "-"}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={()=>setTask({ ...task, volunteer: m.name })} variant={task.volunteer===m.name?"contained":"outlined"}>Select</Button>
                    </TableCell>
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
