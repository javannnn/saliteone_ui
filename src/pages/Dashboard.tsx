import { useQuery } from "@tanstack/react-query";
import { ping, getMyTaskCount, getPendingApprovalsCount, getRecentActivity, getProcessStatusBuckets } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { t } from "@/lib/i18n";
import { fmt } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { locale } = useUI();

  const pingQ = useQuery({ queryKey: ["ping"], queryFn: ping });
  const tasksQ = useQuery({ queryKey: ["my_tasks"], queryFn: getMyTaskCount });
  const approvalsQ = useQuery({ queryKey: ["approvals"], queryFn: getPendingApprovalsCount });
  const recentQ = useQuery({ queryKey: ["recent_activity"], queryFn: () => getRecentActivity(5) });
  const bucketsQ = useQuery({ queryKey: ["process_buckets"], queryFn: getProcessStatusBuckets });

  const showApprovals = (user?.roles || []).some(r => ["Approver","Finance","Administrator","System Manager","Admin"].includes(r));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("dashboard", locale)}</h1>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-zinc-500">{t("my_tasks", locale)}</div>
          <div className="mt-2 text-3xl font-semibold">
            {tasksQ.isLoading ? <div className="h-8 w-20 animate-pulse rounded bg-zinc-800/20"/> : tasksQ.data}
          </div>
        </Card>
        {showApprovals && (
          <Card className="p-4">
            <div className="text-sm text-zinc-500">{t("approvals", locale)}</div>
            <div className="mt-2 text-3xl font-semibold">
              {approvalsQ.isLoading ? <div className="h-8 w-20 animate-pulse rounded bg-zinc-800/20"/> : approvalsQ.data}
            </div>
          </Card>
        )}
        <Card className="p-4 sm:col-span-2">
          <div className="text-sm text-zinc-500">Open Processes by Status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {bucketsQ.isLoading && <div className="h-6 w-40 animate-pulse rounded bg-zinc-800/20"/>}
            {!bucketsQ.isLoading && bucketsQ.data && Object.entries(bucketsQ.data).map(([k,v]) => (
              <div key={k} className="rounded-full border px-3 py-1 text-sm">
                {k}: <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="mb-2 text-sm text-zinc-500">{t("recent", locale)}</div>
        {recentQ.isLoading && <div className="h-6 w-48 animate-pulse rounded bg-zinc-800/20"/>}
        {recentQ.isError && <div className="text-red-600">Failed to load.</div>}
        {recentQ.data && (
          <ul className="divide-y">
            {recentQ.data.map(item => (
              <li key={item.name} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-zinc-500">{item.status}</div>
                </div>
                <div className="text-zinc-500">{fmt(item.modified)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Backend status */}
      <Card>
        {pingQ.isLoading ? <div className="flex items-center gap-2"><Spinner /> <span>Checking backend…</span></div> :
         pingQ.isError ? <div className="text-red-600">Backend unreachable.</div> :
         <div className="text-green-700">Backend OK: {JSON.stringify(pingQ.data)}</div>}
      </Card>
    </div>
  );
}
