import * as React from "react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Alert from "@mui/material/Alert";

type Row = { first_name:string; last_name:string; email:string; phone?:string; group?:string; services?:string };

export default function VolunteerBulkUpload() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [ok, setOk] = React.useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setOk(null); setErrors([]);
    const file = e.target.files?.[0];
    if(!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const wb = XLSX.read(fr.result as ArrayBuffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
      setRows(json);
    };
    fr.readAsArrayBuffer(file);
  }

  async function importAll() {
    setOk(null); setErrors([]);
    try {
      const { data } = await api.post("/method/salitemiret.api.volunteer.bulk_upsert", { rows });
      if (data?.message?.errors?.length) setErrors(data.message.errors);
      setOk(`Imported ${data?.message?.imported || 0} volunteers`);
    } catch (e:any) {
      setErrors([e?.message || "Import failed"]);
    }
  }

  return (
    <Card sx={{ m:2 }}>
      <CardHeader title="Bulk Upload Volunteers" />
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ mb:2 }}>
          <Button variant="outlined" component="label">
            Select .xlsx
            <input type="file" hidden accept=".xlsx,.xls" onChange={onFile}/>
          </Button>
          {rows.length>0 && <Button variant="contained" onClick={importAll}>Import {rows.length}</Button>}
          <Button href="/templates/volunteers_template.xlsx" download>Download Template</Button>
        </Stack>
        {ok && <Alert severity="success">{ok}</Alert>}
        {errors.map((er,i)=><Alert key={i} severity="error">{er}</Alert>)}
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>First</TableCell><TableCell>Last</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Group</TableCell><TableCell>Services</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {rows.map((r,i)=>(
              <TableRow key={i}>
                <TableCell>{r.first_name}</TableCell>
                <TableCell>{r.last_name}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.group}</TableCell>
                <TableCell>{r.services}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

