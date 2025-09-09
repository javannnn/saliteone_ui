import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import { getDoc, updateDoc, hasPermission } from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type Proc = { name: string; title: string; status: string; owner?: string; modified?: string };

export default function ProcessDetail() {
  const { name = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const qDoc = useQuery({
    queryKey: ["process", name],
    queryFn: () => getDoc<Proc>("Workflow Process", name, ["name","title","status","owner","modified"]) 
  });

  const [canWrite, setCanWrite] = useState(false);
  useEffect(() => { (async () => setCanWrite(await hasPermission("Workflow Process", "write")))(); }, []);

  const mUpdate = useMutation({
    mutationFn: (patch: Partial<Proc>) => updateDoc<Proc>("Workflow Process", name, patch),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["process", name] }); },
    onError: (e: any) => toast.error(e?.response?.data?.exc || "Save failed")
  });

  if (qDoc.isLoading) return <Card className="p-4"><Spinner /></Card>;
  if (qDoc.isError || !qDoc.data) return <Card className="p-4 text-red-600">Not found.</Card>;
  const p = qDoc.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Process: {p.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav(-1)}>Back</Button>
          {canWrite && <Button onClick={() => mUpdate.mutate({ status: nextStatus(p.status) })}>
            Set {nextStatus(p.status)}
          </Button>}
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div><span className="text-sm text-zinc-500">ID:</span> {p.name}</div>
        <div>
          <Label>Title</Label>
          <Input value={p.title} readOnly />
        </div>
        <div className="flex items-center gap-3">
          <div><span className="text-sm text-zinc-500">Status:</span> {p.status}</div>
          {canWrite && (
            <Button size="sm" onClick={() => mUpdate.mutate({ status: nextStatus(p.status) })} disabled={(mUpdate as any).isPending}>
              {(mUpdate as any).isPending ? "Saving..." : `Set ${nextStatus(p.status)}`}
            </Button>
          )}
        </div>
        <div className="text-xs text-zinc-500">Owner: {p.owner ?? "-"} • Updated: {p.modified ? new Date(p.modified).toLocaleString() : "-"}</div>
      </Card>
    </div>
  );
}

function nextStatus(s: string) {
  if (s === "Draft") return "Pending";
  if (s === "Pending") return "In Progress";
  if (s === "In Progress") return "Done";
  return "Done";
}

