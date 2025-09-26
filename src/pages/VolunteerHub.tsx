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
import { useMemo, useState } from "react";
import { useAuth } from "@/stores/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemberByEmail, getVolunteerByMember, listToDosFor, updateToDo, createServiceLog, listMyServiceLogs, serviceStats } from "@/lib/api";
import TextField from "@mui/material/TextField";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonTable from "@/components/ui/SkeletonTable";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function VolunteerHub() {
  const [tab, setTab] = useState(0);
  const { user } = useAuth();
  const qc = useQueryClient();
  const memberQ = useQuery({ queryKey: ["member-by-email", user?.name], queryFn: () => getMemberByEmail(user!.name), enabled: !!user?.name });
  const volunteerQ = useQuery({ queryKey: ["vol-by-member", memberQ.data?.name], queryFn: () => getVolunteerByMember(memberQ.data!.name), enabled: !!memberQ.data });
  const todosQ = useQuery({ queryKey: ["vol-todos", user?.name], queryFn: () => listToDosFor(user!.name, 20), enabled: !!user?.name && tab===1 });
  const closeTodo = useMutation({ mutationFn: (name: string) => updateToDo(name, "Closed"), onSuccess: () => qc.invalidateQueries({ queryKey: ["vol-todos", user?.name] }) });
  const logsQ = useQuery({ queryKey: ["my-service-logs"], queryFn: () => listMyServiceLogs(50), enabled: tab===2 });
  const statsQ = useQuery({ queryKey: ["my-service-stats", volunteerQ.data?.name], queryFn: () => serviceStats({ volunteer: volunteerQ.data?.name, months: 6 }), enabled: tab===3 && !!volunteerQ.data?.name });
  const [svc, setSvc] = useState({ service_date: "", service_type: "", hours: 1, notes: "" });
  const muSvc = useMutation({
    mutationFn: async () => {
      const volunteer = volunteerQ.data?.name;
      const member = memberQ.data?.name;
      const group = volunteerQ.data?.group;
      await createServiceLog({ volunteer, member, group, ...svc });
    },
    onSuccess: () => { setSvc({ service_date: "", service_type: "", hours: 1, notes: "" }); qc.invalidateQueries({ queryKey: ["my-service-logs"] }); }
  });
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
        {tab===2 && (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Date" type="date" size="small" value={svc.service_date} onChange={(e)=>setSvc({...svc, service_date:e.target.value})} InputLabelProps={{ shrink: true }} />
              <TextField label="Type" size="small" value={svc.service_type} onChange={(e)=>setSvc({...svc, service_type:e.target.value})} placeholder="Ushering" />
              <TextField label="Hours" type="number" size="small" value={svc.hours} onChange={(e)=>setSvc({...svc, hours:Number(e.target.value)||0})} />
              <TextField label="Notes" size="small" value={svc.notes} onChange={(e)=>setSvc({...svc, notes:e.target.value})} sx={{ flex: 1 }} />
              <Button variant="contained" onClick={()=>muSvc.mutate()} disabled={!svc.service_date || !svc.service_type || svc.hours<=0}>Add</Button>
            </Stack>
            {!logsQ.data ? <SkeletonTable /> : (
              (logsQ.data || []).length === 0 ? <EmptyState title="No service logs" subtitle="Log your first service above." /> : (
                <Table size="small">
                  <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Hours</TableCell><TableCell>Status</TableCell><TableCell>Notes</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(logsQ.data || []).map((r:any)=> (
                      <TableRow key={r.name}><TableCell>{r.service_date}</TableCell><TableCell>{r.service_type}</TableCell><TableCell>{r.hours}</TableCell><TableCell>{r.status}</TableCell><TableCell>{r.notes}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </Stack>
        )}
        {tab===3 && (
          <Stack spacing={2}>
            {!statsQ.data ? <SkeletonTable /> : (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Hours by Month</Typography>
                    <Box sx={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={statsQ.data.by_month}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.25}/>
                          <XAxis dataKey="month" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="hours" stroke="#0B57D0" fill="#0B57D033" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Hours by Service Type</Typography>
                    <Box sx={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statsQ.data.by_type} dataKey="hours" nameKey="type" outerRadius={80} label>
                            {(statsQ.data.by_type || []).map((_:any, i:number)=> (
                              <Cell key={i} fill={["#0B57D0","#6750A4","#1E8E3E","#B3261E","#E37400"][i%5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
