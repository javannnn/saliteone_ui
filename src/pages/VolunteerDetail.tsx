import * as React from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

export default function VolunteerDetail() {
  const { volunteerId } = useParams();
  const qc = useQueryClient();

  const vq = useQuery({
    queryKey: ["volunteer", volunteerId],
    enabled: !!volunteerId,
    queryFn: async () => {
      const { data } = await api.get(
        `/resource/Volunteer/${encodeURIComponent(volunteerId!)}`,
        { params: { fields: JSON.stringify(["name","member","group","services"]) }, __skipAuthRedirect: true } as any
      );
      return data.data as any;
    },
    staleTime: 60_000,
  });

  const groupsQ = useQuery({
    queryKey: ["volunteer-groups"],
    queryFn: async () => {
      const { data } = await api.get(
        `/resource/Volunteer%20Group`,
        { params: { fields: JSON.stringify(["group_name"]) , limit_page_length: 999 }, __skipAuthRedirect: true } as any
      );
      return (data.data as any[]).map((g: any) => g.group_name);
    },
    staleTime: 5 * 60_000,
  });

  const mu = useMutation({
    mutationFn: async (patch: any) => {
      return (await api.put(`/resource/Volunteer/${encodeURIComponent(volunteerId!)}`, patch)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["volunteer", volunteerId] }),
  });

  const [tab, setTab] = React.useState(0);
  if (vq.isLoading) return <Card sx={{ m: 2 }}><CardHeader title="Loading volunteer…" /></Card>;
  if (!vq.data) return (
    <Card sx={{ m: 2 }}>
      <CardHeader title="Volunteer not found" />
      <CardContent>
        <Button component={RouterLink} to="/volunteers">Back</Button>
      </CardContent>
    </Card>
  );

  const v = vq.data as any;

  return (
    <Card sx={{ m:2 }}>
      <CardHeader title={`Volunteer: ${v.name}`} subheader={<Stack direction="row" spacing={1}><Chip label={v.group || "No group"}/></Stack>} />
      <CardContent>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb:2 }}>
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="History" />
          <Tab label="Membership" />
        </Tabs>

        {tab===0 && (
          <Stack spacing={2} maxWidth={500}>
            <TextField
              select
              label="Group"
              value={v.group || ""}
              onChange={(e)=>mu.mutate({ group: e.target.value })}
              helperText="Assign a volunteer group"
            >
              {(groupsQ.data || []).map((g:string)=> (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Services"
              value={v.services || ""}
              onChange={(e)=>mu.mutate({ services: e.target.value })}
              multiline
            />
            <Divider/>
            <Stack direction="row" spacing={2}>
              <Button component={RouterLink} to={v.member ? `/members/${encodeURIComponent(v.member)}` : "/members"} variant="outlined" disabled={!v.member}>Open Member</Button>
              <Button component={RouterLink} to="/volunteers" variant="text">Back</Button>
            </Stack>
          </Stack>
        )}

        {tab===1 && <VolunteerTasks volunteer={v} />}
        {tab===2 && <VolunteerHistory volunteer={v} />}
        {tab===3 && <VolunteerMembership volunteer={v} />}
      </CardContent>
    </Card>
  );
}

function VolunteerTasks({ volunteer }: { volunteer: any }) {
  // TODO: implement using existing helpers listToDosFor/createToDo
  return <Box>Tasks UI here (uses your helpers)</Box>;
}

function VolunteerHistory({ volunteer }: { volunteer: any }) {
  // TODO: implement history feed using Workflow Action Log or similar
  return <Box>History feed</Box>;
}

function VolunteerMembership({ volunteer }: { volunteer: any }) {
  // TODO: show linked Member, and allow create/link as needed
  return <Box>Membership linkage</Box>;
}

