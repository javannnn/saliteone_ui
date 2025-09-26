import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useState } from "react";
import { useAuth } from "@/stores/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemberByEmail, getVolunteerByMember, listToDosFor, updateToDo } from "@/lib/api";

export default function VolunteerHub() {
  const [tab, setTab] = useState(0);
  const { user } = useAuth();
  const qc = useQueryClient();
  const memberQ = useQuery({ queryKey: ["member-by-email", user?.name], queryFn: () => getMemberByEmail(user!.name), enabled: !!user?.name });
  const volunteerQ = useQuery({ queryKey: ["vol-by-member", memberQ.data?.name], queryFn: () => getVolunteerByMember(memberQ.data!.name), enabled: !!memberQ.data });
  const todosQ = useQuery({ queryKey: ["vol-todos", user?.name], queryFn: () => listToDosFor(user!.name, 20), enabled: !!user?.name && tab===1 });
  const closeTodo = useMutation({ mutationFn: (name: string) => updateToDo(name, "Closed"), onSuccess: () => qc.invalidateQueries({ queryKey: ["vol-todos", user?.name] }) });
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Volunteer Hub</Typography>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 2 }}>
          <Tab label="My Group" />
          <Tab label="My To-Dos" />
          <Tab label="Services Provided" />
          <Tab label="Hours & Impact" />
        </Tabs>
        {tab===0 && (
          <Typography color="text.secondary">Group: {volunteerQ.data?.group || "No group assigned"}</Typography>
        )}
        {tab===1 && (
          <Table size="small">
            <TableHead><TableRow><TableCell>Description</TableCell><TableCell>Status</TableCell><TableCell width={80}></TableCell></TableRow></TableHead>
            <TableBody>
              {(todosQ.data || []).map((t:any)=>(
                <TableRow key={t.name}>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell><Button size="small" onClick={()=>closeTodo.mutate(t.name)}>Close</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {tab===2 && <Typography color="text.secondary">Service logs — coming soon.</Typography>}
        {tab===3 && <Typography color="text.secondary">Charts — coming soon.</Typography>}
      </CardContent>
    </Card>
  );
}
