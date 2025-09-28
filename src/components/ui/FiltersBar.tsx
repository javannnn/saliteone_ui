import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export default function FiltersBar({ children, onReset, right }:{ children: React.ReactNode; onReset?: ()=>void; right?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'start', sm: 'center' }} justifyContent="space-between">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'start', sm: 'center' }}>
        {children}
        {onReset && <Button size="small" onClick={onReset}>Reset</Button>}
      </Stack>
      <Box>{right}</Box>
    </Stack>
  );
}

