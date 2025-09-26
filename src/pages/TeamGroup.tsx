import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function TeamGroup() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Group Management</Typography>
        <Typography color="text.secondary">Leaders manage members, roles, and tasks — coming soon.</Typography>
      </CardContent>
    </Card>
  );
}

