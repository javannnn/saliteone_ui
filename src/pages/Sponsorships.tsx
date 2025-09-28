import { useQuery } from "@tanstack/react-query";
import { listSponsorships } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export default function Sponsorships() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["sponsorships"], queryFn: listSponsorships });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sponsorships</h1>
      <Card>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1 }}>
          <Button variant="outlined" onClick={()=>exportCSV(data || [])}>Export CSV</Button>
        </Stack>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Sponsor</th>
                <th className="px-3 py-2 text-left">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {data.map(s => (
                <tr key={s.name} className="border-b">
                  <td className="px-3 py-2">{s.sponsor}</td>
                  <td className="px-3 py-2 text-zinc-500">{s.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function exportCSV(rows: any[]) {
  const header = ["sponsor","frequency","name"];
  const lines = [header.join(","), ...rows.map((r:any)=> header.map((h)=> r[h] ?? '').join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = 'sponsorships.csv'; a.click();
}
