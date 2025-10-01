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
import { listPayments } from "@/lib/api";
import FiltersBar from "@/components/ui/FiltersBar";
import DataTable from "@/components/ui/DataTable";
import { useMemo, useState } from "react";

export default function Payments() {
  const q = useQuery({ queryKey: ["payments"], queryFn: listPayments });
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [qtext, setQtext] = useState("");
  const [paymentType, setPaymentType] = useState("");
  useEffect(()=>{
    const url = new URLSearchParams(location.search);
    const v = url.get('q') || '';
    const s = url.get('status') || '';
    const t = url.get('type') || '';
    if (v) setQtext(v);
    if (s) setStatus(s);
    if (t) setPaymentType(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{
    const params = new URLSearchParams();
    if (qtext) params.set('q', qtext);
    if (status) params.set('status', status);
    if (paymentType) params.set('type', paymentType);
    const search = params.toString();
    navigate(search ? `?${search}` : '/payments', { replace: true });
  }, [qtext, status, paymentType]);
  const data = useMemo(()=>{
    const rows = q.data || [];
    const withText = qtext ? rows.filter((r:any)=> [r.member, r.name].some(v=> String(v||"").toLowerCase().includes(qtext.toLowerCase()))) : rows;
    const withType = paymentType ? withText.filter((r:any)=> (r.payment_type||"Other") === paymentType) : withText;
    return status ? withType.filter((r:any)=> (r.status||"") === status) : withType;
  }, [q.data, status, qtext, paymentType]);

  function exportCSV(rows:any[]) {
    const header = ["name","member","payment_type","method","gateway","posting_date","amount","status","gateway_reference"];
    const lines = [header.join(","), ...rows.map(r=> header.map(h=> r[h] ?? "").toString())];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "payments.csv"; a.click();
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Payments</Typography>
      <Card>
        <CardContent>
          <FiltersBar onReset={()=>{ setStatus(""); setQtext(""); setPaymentType(""); navigate('/payments'); }} right={<Button onClick={()=> exportCSV(data)}>Export CSV</Button>}>
            <TextField size="small" label="Search" value={qtext} onChange={(e)=>{ setQtext(e.target.value); }} placeholder="Member or ID" />
            <TextField size="small" label="Status" select value={status} onChange={(e)=>setStatus(String(e.target.value))}>
              <MenuItem value="">All</MenuItem>
              {['Pending','Paid','Failed'].map(s=> (<MenuItem key={s} value={s}>{s}</MenuItem>))}
            </TextField>
            <TextField size="small" label="Payment Type" select value={paymentType} onChange={(e)=>setPaymentType(String(e.target.value))}>
              <MenuItem value="">All</MenuItem>
              {['Tithe','Donation','Sponsorship','Service Fee','Sunday School Fee','Other'].map(t=> (<MenuItem key={t} value={t}>{t}</MenuItem>))}
            </TextField>
            <Button size="small" onClick={()=>{
              const name = window.prompt('Save current filters as preset name');
              if (!name) return;
              const raw = localStorage.getItem('presets:payments');
              const list = raw ? JSON.parse(raw) as Array<{name:string; value:any}> : [];
              const value = { q: qtext, status, type: paymentType };
              const next = [...list.filter(p=>p.name!==name), { name, value }];
              localStorage.setItem('presets:payments', JSON.stringify(next));
            }}>Save preset</Button>
          </FiltersBar>
          <div style={{ marginTop: 8 }}>
            <DataTable columns={[
              { id: 'posting_date', label: 'Date' },
              { id: 'member', label: 'Member' },
              { id: 'payment_type', label: 'Type' },
              { id: 'method', label: 'Method' },
              { id: 'gateway', label: 'Gateway' },
              { id: 'amount', label: 'Amount', align: 'right' },
              { id: 'status', label: 'Status' },
            ]} rows={data as any[]} initialSort={{ by: 'posting_date', dir: 'desc' }} />
          </div>
        </CardContent>
      </Card>
    </Stack>
  );
}
