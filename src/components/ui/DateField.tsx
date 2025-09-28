import TextField from "@mui/material/TextField";

export default function DateField({ label, value, onChange, ...props }: { label?: string; value: string; onChange: (v: string) => void } & Record<string, any>) {
  return (
    <TextField
      label={label}
      type="date"
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      {...props}
    />
  );
}

