import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import { api } from "@/lib/api";

type Row = { first_name: string; last_name: string; email: string; phone?: string; status?: string };

export default function MembersBulkUpload() {
  const [text, setText] = useState("first_name,last_name,email,phone,status\nJane,Doe,jane@example.com,555-0100,Active\nJohn,Smith,john@example.com,555-0101,Pending");
  const [ensureUsers, setEnsureUsers] = useState(true);
  const [roles, setRoles] = useState("Member");
  const [result, setResult] = useState<any>(null);

  function parseCSV(input: string): Row[] {
    const lines = input.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map(h=>h.trim());
    return lines.slice(1).map((ln)=>{
      const cols = ln.split(",");
      const obj: any = {};
      header.forEach((h, i) => obj[h] = (cols[i]||"").trim());
      return obj as Row;
    });
  }

  async function submit() {
    const rows = parseCSV(text);
    const roleList = roles.split(/,\s*/).filter(Boolean);
    const payload = { rows, ensure_users: ensureUsers ? 1 : 0, roles: roleList } as any;
    const r = await api.post("/method/salitemiret.api.admin.bulk_upsert_members", payload);
    setResult(r.data?.message ?? r.data);
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Bulk Upload Members</Typography>
        <Stack spacing={2}>
          <TextField label="CSV" value={text} onChange={(e)=> setText(e.target.value)} multiline minRows={8} />
          <FormControlLabel control={<Checkbox checked={ensureUsers} onChange={(e)=> setEnsureUsers(e.target.checked)} />} label="Also create/promote System Users" />
          <TextField label="Roles (comma-separated)" value={roles} onChange={(e)=> setRoles(e.target.value)} helperText="Assigned when creating users" />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={submit}>Upload</Button>
            <Button onClick={()=> setText("first_name,last_name,email,phone,status\n")}>Clear</Button>
          </Stack>
          {result && (
            <Alert severity={result.errors?.length ? 'warning' : 'success'}>
              Created: {result.created || 0}, Updated: {result.updated || 0}, Users: {result.users || 0}. {result.errors?.length ? `Errors: ${result.errors.join('; ')}` : ''}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

