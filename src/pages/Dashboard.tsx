import { useQuery } from "@tanstack/react-query";
import { ping } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["ping"], queryFn: ping });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        {isLoading ? <div className="flex items-center gap-2"><Spinner /> <span>Checking backend…</span></div> :
         isError ? <div className="text-red-600">Backend unreachable.</div> :
         <div className="text-green-700">Backend OK: {JSON.stringify(data)}</div>}
      </Card>
    </div>
  );
}
