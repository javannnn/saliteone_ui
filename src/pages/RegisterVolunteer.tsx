import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { api } from "@/lib/api";

async function requestVolunteer(payload: any) {
  const r = await api.post("/method/salitemiret.api.public.request_volunteer", payload);
  return r.data;
}

export default function RegisterVolunteer() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", services: "" });
  const m = useMutation({ mutationFn: requestVolunteer });

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "70vh", p: 2 }}>
      <Card sx={{ width: 520, maxWidth: "92vw" }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Become a Volunteer</Typography>
          <Stack spacing={2}>
            <TextField label="Full name" value={form.full_name} onChange={(e)=>setForm({...form, full_name:e.target.value})}/>
            <TextField label="Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}/>
            <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})}/>
            <TextField label="Services (e.g., Ushering)" value={form.services} onChange={(e)=>setForm({...form, services:e.target.value})}/>
            <Button variant="contained" onClick={()=>m.mutate(form)} disabled={m.isPending}>Submit</Button>
            {m.isSuccess && <Alert severity="success">Thanks! We’ll email you after approval.</Alert>}
            {m.isError && <Alert severity="error">{(m.error as any)?.message || "Failed. Try again."}</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

