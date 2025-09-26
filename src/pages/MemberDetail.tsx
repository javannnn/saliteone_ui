import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { api } from "@/lib/api";

type Member = { name: string; first_name?: string; last_name?: string; email?: string; phone?: string; status?: string };

export default function MemberDetail() {
  const { name = "" } = useParams();
  const nav = useNavigate();

  const q = useQuery({
    queryKey: ["member", name],
    enabled: !!name,
    queryFn: async () => {
      const { data } = await api.get(
        `/resource/${encodeURIComponent("Member")}/${encodeURIComponent(name)}`,
        { params: { fields: JSON.stringify(["name","first_name","last_name","email","phone","status"]) }, __skipAuthRedirect: true } as any
      );
      return data.data as Member;
    }
  });

  if (q.isLoading) return <Card className="p-4"><Spinner /></Card>;
  if (q.isError || !q.data) return <Card className="p-4 text-red-600">Not found.</Card>;
  const m = q.data;
  const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.name;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Member: {fullName}</h1>
        <Button variant="outline" onClick={() => nav(-1)}>Back</Button>
      </div>
      <Card className="p-4 space-y-2">
        <div><span className="text-sm text-zinc-500">ID:</span> {m.name}</div>
        <div><span className="text-sm text-zinc-500">Email:</span> {m.email || "-"}</div>
        <div><span className="text-sm text-zinc-500">Phone:</span> {m.phone || "-"}</div>
        <div><span className="text-sm text-zinc-500">Status:</span> {m.status || "-"}</div>
      </Card>
    </div>
  );
}
