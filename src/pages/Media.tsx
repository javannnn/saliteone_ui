import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listMediaRequests } from "@/lib/api";
import FiltersBar from "@/components/ui/FiltersBar";
import DataTable from "@/components/ui/DataTable";
import { useMemo, useState } from "react";

export default function Media() {
  const q = useQuery({ queryKey: ["media"], queryFn: listMediaRequests });
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("");
  const [qtext, setQtext] = useState("");
  useEffect(()=>{
    const sp = new URLSearchParams(location.search);
    const vq = sp.get('q') || '';
    const vs = sp.get('status') || '';
    if (vq) setQtext(vq);
    if (vs) setStatus(vs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{
    const sp = new URLSearchParams();
    if (qtext) sp.set('q', qtext);
    if (status) sp.set('status', status);
    const s = sp.toString();
    navigate(s ? `?${s}` : '/media', { replace: true });
  }, [qtext, status]);
  const data = useMemo(()=>{
    const rows = q.data || [];
    const withText = qtext ? rows.filter((r:any)=> [r.title, r.name].some(v=> String(v||"").toLowerCase().includes(qtext.toLowerCase()))) : rows;
    return status ? withText.filter((r:any)=> (r.status||"") === status) : withText;
  }, [q.data, status, qtext]);

  function exportCSV(rows:any[]) {
    const header = ["name","title","status"];
    const lines = [header.join(","), ...rows.map(r=> header.map(h=> r[h] ?? "").toString())];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "media_requests.csv"; a.click();
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Media Requests</Typography>
      <Card>
        <CardContent>
          <FiltersBar onReset={()=>{ setStatus(""); setQtext(""); }} right={<Button onClick={()=> exportCSV(data)}>Export CSV</Button>}>
            <TextField size="small" label="Search" value={qtext} onChange={(e)=>setQtext(e.target.value)} placeholder="Title or ID" />
            <TextField size="small" label="Status" select value={status} onChange={(e)=>setStatus(String(e.target.value))}>
              <MenuItem value="">All</MenuItem>
              {['Submitted','Approved','Rejected'].map(s=> (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
            <Button size="small" onClick={()=>{
              const name = window.prompt('Save current filters as preset name');
              if (!name) return;
              const raw = localStorage.getItem('presets:media');
              const list = raw ? JSON.parse(raw) as Array<{name:string; value:any}> : [];
              const value = { q: qtext, status };
              const next = [...list.filter(p=>p.name!==name), { name, value }];
              localStorage.setItem('presets:media', JSON.stringify(next));
            }}>Save preset</Button>
          </FiltersBar>
          <div style={{ marginTop: 8 }}>
            <DataTable columns={[
              { id: 'title', label: 'Title' },
              { id: 'status', label: 'Status' },
              { id: 'requester', label: 'Requester' },
              { id: 'actions', label: 'Actions', render: (row:any) => (
                <Button size="small" onClick={()=> navigate(`/members?q=${encodeURIComponent(row.requester||'')}`)} disabled={!row.requester}>Open requester</Button>
              ), sortable: false, align: 'right' as const },
            ]} rows={data as any[]} initialSort={{ by: 'title', dir: 'asc' }} />
          </div>
        </CardContent>
      </Card>
    </Stack>
  );
}
