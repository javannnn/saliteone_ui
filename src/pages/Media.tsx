import { useQuery } from "@tanstack/react-query";
import { listMediaRequests } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Media() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["media"], queryFn: listMediaRequests });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Media</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(m => (
                <tr key={m.name} className="border-b">
                  <td className="px-3 py-2">{m.title}</td>
                  <td className="px-3 py-2 text-zinc-500">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
