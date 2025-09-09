import { useQuery } from "@tanstack/react-query";
import { listProcesses } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Processes() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["processes"], queryFn: listProcesses });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Processes</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading processes…</span></div>}
        {isError && <div className="text-red-600">Failed to load processes.</div>}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Name</th>
                </tr>
              </thead>
              <tbody>
                {data?.map(p => (
                  <tr key={p.name} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-3 py-2">{p.title}</td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="px-3 py-2 text-zinc-500">{p.name}</td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr><td className="px-3 py-6 text-zinc-500" colSpan={3}>No processes yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
