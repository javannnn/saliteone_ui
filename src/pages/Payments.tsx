import { useQuery } from "@tanstack/react-query";
import { listPayments } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Payments() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["payments"], queryFn: listPayments });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <Card>
        {isLoading && <div className="flex items-center gap-2"><Spinner /><span>Loading…</span></div>}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Member</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.name} className="border-b">
                  <td className="px-3 py-2">{p.member}</td>
                  <td className="px-3 py-2">{p.amount}</td>
                  <td className="px-3 py-2 text-zinc-500">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
