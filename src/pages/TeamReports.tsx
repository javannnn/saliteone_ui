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
import { useQuery } from "@tanstack/react-query";
import { listVolunteerGroups, groupReport } from "@/lib/api";

export default function TeamReports() {
  const groupsQ = useQuery({ queryKey: ["tl-groups"], queryFn: () => listVolunteerGroups() });
  const [group, setGroup] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const repQ = useQuery({ queryKey: ["tl-report", group, from, to], queryFn: () => groupReport(group, from || undefined, to || undefined), enabled: !!group });

  function exportCSV() {
    const rows = repQ.data?.rows || [];
    const header = ["volunteer","service_date","service_type","hours","status"];
    const lines = [header.join(","), ...rows.map((r:any)=> header.map((h)=>r[h]).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `group_report_${group}.csv`;
    a.click();
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Group Reports</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Group" value={group} onChange={(e)=>setGroup(e.target.value)} sx={{ minWidth: 240 }}>
            {(groupsQ.data || []).map((g:any)=> (
              <MenuItem key={g.name} value={g.group_name || g.name}>{g.group_name || g.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="From" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" value={to} onChange={(e)=>setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="outlined" onClick={exportCSV} disabled={!repQ.data}>Export CSV</Button>
        </Stack>
        {!group ? <EmptyState title="Select a group" /> : !repQ.data ? <SkeletonTable /> : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>Total hours: <b>{repQ.data.total_hours || 0}</b> • Participants: <b>{repQ.data.participants || 0}</b> • Participation: <b>{repQ.data.participation_rate || 0}%</b></Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Volunteer</TableCell><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Hours</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {(repQ.data.rows || []).map((r:any)=> (
                  <TableRow key={`${r.volunteer}-${r.service_date}`}><TableCell>{r.volunteer}</TableCell><TableCell>{r.service_date}</TableCell><TableCell>{r.service_type}</TableCell><TableCell>{r.hours}</TableCell><TableCell>{r.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
