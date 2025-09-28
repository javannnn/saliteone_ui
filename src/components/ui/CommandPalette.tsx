import { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import { listDocs } from "@/lib/api";

type Entry = { label: string; to: string };

const STATIC: Entry[] = [
  { label: "My Membership", to: "/membership" },
  { label: "Members Directory", to: "/members" },
  { label: "Volunteer Hub", to: "/volunteers" },
  { label: "Team Approvals", to: "/team/approvals" },
  { label: "Payments", to: "/payments" },
  { label: "Media Requests", to: "/media" },
  { label: "Notifications", to: "/notifications" },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Array<{ name:string; first_name?:string; last_name?:string }>>([]);
  const [media, setMedia] = useState<Array<{ name:string; title:string }>>([]);
  const [payments, setPayments] = useState<Array<{ name:string; member:string }>>([]);

  useEffect(()=>{
    let alive = true;
    (async()=>{
      if (!open) return;
      try {
        setLoading(true);
        const rows = await listDocs("Member", { fields: ["name","first_name","last_name"], limit: 20, order_by: "modified desc" });
        const med = await listDocs("Media Request", { fields: ["name","title"], limit: 10, order_by: "modified desc" });
        const pays = await listDocs("Payment", { fields: ["name","member"], limit: 10, order_by: "modified desc" });
        if (alive) { setMembers(rows as any); setMedia(med as any); setPayments(pays as any); }
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return ()=>{ alive=false };
  }, [open]);

  const results = useMemo(()=>{
    const base = [
      ...STATIC,
      ...members.map(m=> ({ label: `Member · ${m.first_name||''} ${m.last_name||''}`.trim(), to: `/members/${encodeURIComponent(m.name)}`})),
      ...media.map(m=> ({ label: `Media · ${m.title}`, to: `/media` })),
      ...payments.map(p=> ({ label: `Payment · ${p.name}`, to: `/payments` })),
    ];
    const qq = q.trim().toLowerCase();
    if (!qq) return base.slice(0, 10);
    return base.filter(e => e.label.toLowerCase().includes(qq)).slice(0, 10);
  }, [q, members]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <TextField autoFocus value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search (/, Ctrl+K)…" size="small" />
          {loading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 2 }}><CircularProgress size={22}/></Box>
          ) : (
            <List dense>
              {results.map((r)=> (
                <ListItemButton key={r.to} onClick={()=>{ onClose(); nav(r.to); }}>
                  <ListItemText primary={r.label} secondary={r.to} />
                </ListItemButton>
              ))}
              {results.length===0 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>No matches</Typography>
              )}
            </List>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
