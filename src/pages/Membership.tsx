import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useState } from "react";

export default function Membership() {
  const [tab, setTab] = useState(0);
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>My Membership</Typography>
        <Tabs value={tab} onChange={(_,x)=>setTab(x)} sx={{ mb: 2 }}>
          <Tab label="Profile & Family" />
          <Tab label="Status" />
          <Tab label="Payments & Tithes" />
          <Tab label="Sponsorships" />
          <Tab label="Schools" />
        </Tabs>
        <Box sx={{ color: "text.secondary" }}>Coming soon — wired to backend according to blueprint.</Box>
      </CardContent>
    </Card>
  );
}

