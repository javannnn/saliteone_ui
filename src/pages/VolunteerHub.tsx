import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useState } from "react";

export default function VolunteerHub() {
  const [tab, setTab] = useState(0);
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Volunteer Hub</Typography>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 2 }}>
          <Tab label="My Group" />
          <Tab label="My To-Dos" />
          <Tab label="Services Provided" />
          <Tab label="Hours & Impact" />
        </Tabs>
        <Typography color="text.secondary">Coming soon — integrated with ToDo and service logs.</Typography>
      </CardContent>
    </Card>
  );
}

