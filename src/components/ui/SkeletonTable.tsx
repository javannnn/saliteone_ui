import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

export default function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ p: 1 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={28} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}

