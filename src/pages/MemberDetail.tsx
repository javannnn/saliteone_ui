import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { api } from "@/lib/api";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { useState } from "react";

type Member = { name: string; first_name?: string; last_name?: string; email?: string; phone?: string; status?: string };

export default function MemberDetail() {
  const { name = "" } = useParams();
  const nav = useNavigate();

  const q = useQuery({
    queryKey: ["member", name],
    enabled: !!name,
    queryFn: async () => {
      const { data } = await api.get(
        `/resource/${encodeURIComponent("Member")}/${encodeURIComponent(name)}`,
        { params: { fields: JSON.stringify(["name","first_name","last_name","email","phone","status"]) }, __skipAuthRedirect: true } as any
      );
      return data.data as Member;
    }
  });

  // All hooks must be declared before any conditional return
  const [tab, setTab] = useState(0);

  const isLoading = q.isLoading;
  const hasError = q.isError || !q.data;
  const m = q.data as Member | undefined;
  const fullName = m ? ([m.first_name, m.last_name].filter(Boolean).join(" ") || m.name) : "";

  const paymentsQ = useQuery({
    queryKey: ["payments", name],
    queryFn: async () => {
      const r = await api.get("/resource/Payment", { params: { fields: JSON.stringify(["name","amount","status","mode_of_payment","posting_date"]), filters: JSON.stringify({ member: name }), order_by: "posting_date desc", limit_page_length: 50 }, __skipAuthRedirect: true } as any);
      return r.data.data as Array<any>;
    },
    enabled: tab===2 && !!name,
  });

  const sponsorshipsQ = useQuery({
    queryKey: ["sponsorships", name],
    queryFn: async () => {
      const r = await api.get("/resource/Sponsorship", { params: { fields: JSON.stringify(["name","sponsor","frequency","status"]), filters: JSON.stringify({ sponsor: name }), limit_page_length: 50 }, __skipAuthRedirect: true } as any);
      return r.data.data as Array<any>;
    },
    enabled: tab===3 && !!name,
  });

  if (isLoading) return <Card className="p-4"><Spinner /></Card>;
  if (hasError || !m) return <Card className="p-4 text-red-600">Not found.</Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Member: {fullName}</h1>
        <Button variant="outline" onClick={() => nav(-1)}>Back</Button>
      </div>
      <Card className="p-4 space-y-2">
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} className="mb-2">
          <Tab label="Profile" />
          <Tab label="Household" />
          <Tab label="Payments/Tithes" />
          <Tab label="Sponsorships" />
          <Tab label="History" />
        </Tabs>
        {tab===0 && (
          <Box className="space-y-2">
            <div><span className="text-sm text-zinc-500">ID:</span> {m.name}</div>
            <div><span className="text-sm text-zinc-500">Email:</span> {m.email || "-"}</div>
            <div><span className="text-sm text-zinc-500">Phone:</span> {m.phone || "-"}</div>
            <div><span className="text-sm text-zinc-500">Status:</span> {m.status || "-"}</div>
          </Box>
        )}
        {tab===1 && (
          <Box className="text-sm text-zinc-500">Household editor coming soon (spouse/children)</Box>
        )}
        {tab===2 && (
          <Box>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Date</TableCell><TableCell>Mode</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {(paymentsQ.data || []).map((p:any)=> (
                  <TableRow key={p.name}><TableCell>{p.posting_date}</TableCell><TableCell>{p.mode_of_payment}</TableCell><TableCell>{p.status}</TableCell><TableCell align="right">{p.amount}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {tab===3 && (
          <Box>
            <Table size="small">
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Frequency</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {(sponsorshipsQ.data || []).map((s:any)=> (
                  <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell>{s.frequency}</TableCell><TableCell>{s.status}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {tab===4 && (
          <Box className="text-sm text-zinc-500">Activity history and reports coming soon</Box>
        )}
      </Card>
    </div>
  );
}
