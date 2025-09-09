import { useQuery } from "@tanstack/react-query";
import { listNewcomers } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Newcomers() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["newcomers"], queryFn: listNewcomers });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Newcomers</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Full Name</th>
                <th className="px-3 py-2 text-left">Family Size</th>
              </tr>
            </thead>
            <tbody>
              {data.map(n => (
                <tr key={n.name} className="border-b">
                  <td className="px-3 py-2">{n.full_name}</td>
                  <td className="px-3 py-2 text-zinc-500">{n.family_size ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
