import { useQuery } from "@tanstack/react-query";
import { listProcesses, createProcess } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

export default function Processes() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["processes"], queryFn: listProcesses });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); }, [open]);

  async function onCreate() {
    try {
      await createProcess({ title, status: "Draft" });
      setOpen(false); setTitle("");
      toast.success("Process created");
      queryClient.invalidateQueries({ queryKey: ["processes"] });
    } catch (e: any) {
      toast.error(e?.response?.data?._error_message || "Failed to create");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Processes</h1>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processes</h1>
        <Button onClick={() => setOpen(true)}>Create</Button>
      </div>
      <Card className="mt-2">
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

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-semibold">Create Process</h2>
            <div className="space-y-3">
              <Input ref={inputRef} placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={onCreate} disabled={!title.trim()}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
