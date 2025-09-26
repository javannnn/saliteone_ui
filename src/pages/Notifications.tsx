import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import SkeletonTable from "@/components/ui/SkeletonTable";
import EmptyState from "@/components/ui/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { useState } from "react";
import { useUI } from "@/stores/ui";
import { tSafe } from "@/lib/i18n";

export default function Notifications() {
  const { locale } = useUI();
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const q = useQuery({ queryKey: ["notifs", page], queryFn: () => listMyNotifications(pageSize) });

  const rows = (q.data || []) as Array<any>;

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "start", sm: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">{tSafe("notifications", locale, "Notifications")}</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={async ()=>{ await markAllNotificationsRead(); q.refetch(); }}>{tSafe("mark_all_read", locale, "Mark all as read")}</Button>
          </Stack>
        </Stack>
        {!q.data ? <SkeletonTable rows={6}/> : (
          rows.length === 0 ? <EmptyState title="No notifications" /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Subject</TableCell><TableCell>Message</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
              <TableBody>
                {rows.map((n:any)=> (
                  <TableRow key={n.name}>
                    <TableCell>{new Date(n.creation).toLocaleString()}</TableCell>
                    <TableCell>{n.subject}</TableCell>
                    <TableCell>{n.email_content}</TableCell>
                    <TableCell>{n.read ? "Read" : "Unread"}</TableCell>
                    <TableCell>
                      {!n.read && <Button size="small" onClick={async ()=>{ await markNotificationRead(n.name); q.refetch(); }}>{tSafe("mark_read", locale, "Mark as read")}</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button disabled={page===0} onClick={()=>setPage((p)=>Math.max(0,p-1))}>Prev</Button>
          <Typography variant="body2" sx={{ alignSelf: "center" }}>Page {page+1}</Typography>
          <Button onClick={()=>setPage((p)=>p+1)}>Next</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

