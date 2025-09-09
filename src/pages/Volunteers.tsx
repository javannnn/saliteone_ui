import { useQuery } from "@tanstack/react-query";
import { listVolunteers } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Volunteers() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["volunteers"], queryFn: listVolunteers });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Volunteers</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Member</th>
                <th className="px-3 py-2 text-left">Group</th>
              </tr>
            </thead>
            <tbody>
              {data.map(v => (
                <tr key={v.name} className="border-b">
                  <td className="px-3 py-2">{v.member}</td>
                  <td className="px-3 py-2 text-zinc-500">{v.group ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
