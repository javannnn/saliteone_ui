import { useQuery, useMutation } from "@tanstack/react-query";
import { getAdminDashboardCounts } from "@/lib/api";
import { api } from "@/lib/api";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

function Card({ title, value }: { title: string; value: number }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: (t)=>`1px solid ${t.palette.divider}` }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

export default function AdminDashboard() {
  const q = useQuery({ queryKey: ["admin-counts"], queryFn: getAdminDashboardCounts });
  const c = q.data || {};
  const seed = useMutation({
    mutationFn: async () => (await api.post('/method/salitemiret.api.mock.seed_mock_data', {})).data,
    onSuccess: () => q.refetch()
  });
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={()=>seed.mutate()} disabled={seed.isPending}>Seed Demo Data</Button>
        </Stack>
      </Grid>
      <Grid item xs={12} md={3}><Card title="Pending Members" value={c.pending_members || 0} /></Grid>
      <Grid item xs={12} md={3}><Card title="Service Logs" value={c.pending_service_logs || 0} /></Grid>
      <Grid item xs={12} md={3}><Card title="Media Pending" value={c.pending_media || 0} /></Grid>
      <Grid item xs={12} md={3}><Card title="Newcomers" value={c.newcomers_open || 0} /></Grid>
    </Grid>
  );
}
