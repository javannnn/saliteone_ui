import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function EmptyState({ title, subtitle, actionLabel, onAction }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{title}</Typography>
      {subtitle && <Typography variant="body2" sx={{ mb: 1.5 }}>{subtitle}</Typography>}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
      )}
    </Box>
  );
}

