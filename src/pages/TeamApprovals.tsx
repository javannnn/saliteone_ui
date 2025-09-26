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
import SkeletonTable from "@/components/ui/SkeletonTable";
import EmptyState from "@/components/ui/EmptyState";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listVolunteerGroups, listGroupServiceLogs, approveServiceLog, rejectServiceLog } from "@/lib/api";

export default function TeamApprovals() {
  const qc = useQueryClient();
  const groupsQ = useQuery({ queryKey: ["tl-groups"], queryFn: () => listVolunteerGroups() });
  const [group, setGroup] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const logsQ = useQuery({ queryKey: ["tl-logs", group, page], queryFn: () => listGroupServiceLogs(group, pageSize, page*pageSize), enabled: !!group });
  const approve = useMutation({ mutationFn: (name: string) => approveServiceLog(name), onSuccess: ()=> qc.invalidateQueries({ queryKey: ["tl-logs", group] }) });
  const reject = useMutation({ mutationFn: ({ name, reason }: any) => rejectServiceLog(name, reason), onSuccess: ()=> qc.invalidateQueries({ queryKey: ["tl-logs", group] }) });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Team Approvals</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Group" value={group} onChange={(e)=>setGroup(e.target.value)} sx={{ minWidth: 240 }} data-testid="tl-approvals-group">
            {(groupsQ.data || []).map((g:any)=> (
              <MenuItem key={g.name} value={g.group_name || g.name}>{g.group_name || g.name}</MenuItem>
            ))}
          </TextField>
        </Stack>
        {!group ? <EmptyState title="Select a group" /> : !logsQ.data ? <SkeletonTable /> : (
          (logsQ.data || []).length === 0 ? <EmptyState title="No pending logs" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Hours</TableCell><TableCell>Status</TableCell><TableCell>Notes</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {(logsQ.data || []).map((r:any)=> (
                  <TableRow key={r.name}>
                    <TableCell>{r.service_date}</TableCell>
                    <TableCell>{r.service_type}</TableCell>
                    <TableCell>{r.hours}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.notes}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button data-testid={`approve-${r.name}`} size="small" variant="contained" onClick={()=>approve.mutate(r.name)}>Approve</Button>
                        <Button data-testid={`reject-${r.name}`} size="small" color="error" onClick={()=>reject.mutate({ name: r.name })}>Reject</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button disabled={page===0} onClick={()=>setPage((p)=>Math.max(0,p-1))}>Prev</Button>
          <Button onClick={()=>setPage((p)=>p+1)}>Next</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
