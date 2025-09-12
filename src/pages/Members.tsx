import { useQuery } from "@tanstack/react-query";
import { listMembers } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import { Link } from "react-router-dom";

export default function Members() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["members"], queryFn: listMembers });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Members</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">First Name</th>
                <th className="px-3 py-2 text-left">Last Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(m => (
                <tr key={m.name} className="border-b">
                  <td className="px-3 py-2">
                    <Link className="text-brand-600 underline" to={`/members/${encodeURIComponent(m.name)}`}>
                      {m.first_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{m.last_name}</td>
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
