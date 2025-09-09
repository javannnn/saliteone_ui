import { useQuery } from "@tanstack/react-query";
import { listSchoolEnrollments } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Schools() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["schools"], queryFn: listSchoolEnrollments });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Schools</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Member</th>
                <th className="px-3 py-2 text-left">Child</th>
                <th className="px-3 py-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {data.map(s => (
                <tr key={s.name} className="border-b">
                  <td className="px-3 py-2">{s.member ?? "-"}</td>
                  <td className="px-3 py-2">{s.child_name ?? "-"}</td>
                  <td className="px-3 py-2 text-zinc-500">{s.school_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
