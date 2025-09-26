import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import RuleIcon from "@mui/icons-material/Rule";
import TimelineIcon from "@mui/icons-material/Timeline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

import {
  ping,
  getMyTaskCount,
  getPendingApprovalsCount,
  getRecentActivity,
  getProcessStatusBuckets,
  type RecentItem,
} from "@/lib/api";
import { useAuth } from "@/stores/auth";

function Card({ title, icon, value, children }: { title: string; icon: React.ReactNode; value?: string | number; children?: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: (t) => `1px solid ${t.palette.divider}` }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>{icon}</Avatar>
      </Stack>
      {children ?? (
        value !== undefined ? (
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>{value}</Typography>
        ) : null
      )}
    </Paper>
  );
}

function StatusChip({ label }: { label: string }) {
  const color =
    /done|approved|complete/i.test(label) ? "success" :
    /pending|review/i.test(label) ? "warning" :
    /open|new/i.test(label) ? "info" : "default";
  return <Chip label={label} size="small" color={color as any} />;
}

function formatTime(ts: string) {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

export default function Dashboard() {
  const { user, roles } = useAuth();
  const nav = useNavigate();
  const isVolunteer = useMemo(() => (roles || []).includes("Volunteer"), [roles]);
  const isApprover = useMemo(
    () => (roles || []).some((r) => r === "Admin" || r === "Volunteer Admin"),
    [roles]
  );

  const qPing = useQuery({ queryKey: ["ping"], queryFn: ping });
  const qTasks = useQuery({ queryKey: ["me", "tasks"], queryFn: getMyTaskCount });
  const qApprovals = useQuery({ queryKey: ["approvals", "pending"], queryFn: getPendingApprovalsCount });
  const qRecent = useQuery({ queryKey: ["processes", "recent"], queryFn: () => getRecentActivity(8) });
  const qBuckets = useQuery({ queryKey: ["processes", "buckets"], queryFn: getProcessStatusBuckets });

  const chartData = useMemo(() => {
    const arr = (qRecent.data || []) as RecentItem[];
    const bucket = new Map<string, number>();
    for (const r of arr) {
      const d = new Date(r.modified);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    }
    return Array.from(bucket, ([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
  }, [qRecent.data]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Hero */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: (t) => `1px solid ${t.palette.divider}`,
        background: (t) => t.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(14,87,208,.2), rgba(103,80,164,.15))"
          : "linear-gradient(135deg, rgba(14,87,208,.08), rgba(103,80,164,.06))" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: .5 }}>Welcome{user ? `, ${user.full_name}` : ""} 👋</Typography>
        <Typography color="text.secondary">Here’s what’s happening across your workspace today.</Typography>
      </Paper>

      <Grid container spacing={2}>
        {/* Get Started panel when empty */}
        {((qTasks.data ?? 0) === 0 && (qApprovals.data ?? 0) === 0 && (!qBuckets.data || qBuckets.data.length === 0)) && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2.5, border: (t)=>`1px solid ${t.palette.divider}` }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "start", sm: "center" }} justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: .5 }}>Get started</Typography>
                  <Typography color="text.secondary">Create your volunteer profile or open admin tools to add groups and volunteers.</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {isVolunteer && (
                    <Button variant="contained" size="small" onClick={() => nav("/volunteers")}>Set up your volunteer profile</Button>
                  )}
                  {isApprover && !isVolunteer && (
                    <Button variant="outlined" component={RouterLink} to="/volunteers">Volunteer administration</Button>
                  )}
                  {(roles || []).some((r) => r === "Finance" || r === "Admin") && (
                    <Button variant="text" component={RouterLink} to="/members">Memberships</Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        )}
        {/* KPIs */}
        <Grid item xs={12} md={4}>
          <Card title="My Open Tasks" icon={<AssignmentTurnedInIcon fontSize="small" />}>
            {qTasks.isLoading ? (
              <Skeleton width={80} height={42} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>{qTasks.data ?? 0}</Typography>
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card title="Pending Approvals" icon={<RuleIcon fontSize="small" />}>
            {qApprovals.isLoading ? (
              <Skeleton width={80} height={42} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>{qApprovals.data ?? 0}</Typography>
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card title="Backend Health" icon={<TimelineIcon fontSize="small" />}>
            {qPing.isLoading ? (
              <Skeleton width={160} height={28} />
            ) : (
              <Typography sx={{ fontWeight: 600 }} color="success.main">OK</Typography>
            )}
          </Card>
        </Grid>

        {/* Status buckets */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="overline" color="text.secondary">Open Processes by Status</Typography>
              <Stack direction="row" spacing={1}>
                <Chip icon={<PendingActionsIcon />} label="Pending" size="small" />
                <Chip icon={<DoneAllIcon />} label="Done" size="small" />
                <Chip icon={<CheckCircleIcon />} label="In Progress" size="small" />
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {qBuckets.isLoading && <>
                <Skeleton variant="rounded" width={120} height={32} />
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={140} height={32} />
              </>}
              {qBuckets.data && qBuckets.data.map((b) => (
                <Chip key={b.status} label={`${b.status}: ${b.count}`} variant="outlined" />
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Activity sparkline */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Typography variant="overline" color="text.secondary">Recent Activity (by day)</Typography>
            <Box sx={{ height: 200, mt: 1 }}>
              {qRecent.isLoading ? (
                <Skeleton variant="rounded" width="100%" height="100%" />
              ) : chartData.length === 0 ? (
                <Box sx={{ display:"grid", placeItems:"center", height: "100%" }}>
                  <Typography color="text.secondary">No recent changes</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B57D0" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#0B57D0" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25}/>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                    <YAxis allowDecimals={false} width={28}/>
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#0B57D0" fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent list */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Typography variant="overline" color="text.secondary">Recent Workflow Updates</Typography>
            <Divider sx={{ my: 1.5 }} />
            {qRecent.isLoading ? (
              <>
                <Skeleton height={28} />
                <Skeleton height={28} />
                <Skeleton height={28} />
              </>
            ) : (
              <List dense disablePadding>
                {(qRecent.data || []).map((row) => (
                  <ListItemButton
                    key={row.name}
                    component={RouterLink}
                    to={`/processes/${encodeURIComponent(row.name)}`}
                    sx={{ px: 2, py: 1 }}
                    aria-label={`Open ${row.title} (${row.status})`}
                  >
                    <ListItemText
                      primary={row.title}
                      secondary={formatTime(row.modified)}
                      primaryTypographyProps={{ noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                    <Chip
                      size="small"
                      label={row.status || "Unknown"}
                      clickable
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nav(`/processes?status=${encodeURIComponent(row.status || "")}`);
                      }}
                      aria-label={`Filter by status ${row.status}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
