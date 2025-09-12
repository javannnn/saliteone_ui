import { PropsWithChildren, useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useUI } from "@/stores/ui";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

function makeTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#0B57D0" },
      secondary: { main: "#6750A4" },
      ...(mode === "dark"
        ? { background: { default: "#0B0F12", paper: "#121417" } }
        : { background: { default: "#F7F9FC", paper: "#FFFFFF" } }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: [
        '"Roboto Flex"', "Inter", "system-ui", "-apple-system", "Segoe UI",
        "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"
      ].join(","),
      h1: { fontWeight: 700, letterSpacing: "-0.4px" },
      h2: { fontWeight: 700, letterSpacing: "-0.2px" },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: "none", borderRadius: 12 } },
      },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 10, margin: "2px 8px" } } },
    },
  });
}

export function ThemeContainer({ children }: PropsWithChildren) {
  const { theme } = useUI();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mode: PaletteMode = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  const themeObj = useMemo(() => makeTheme(mode), [mode]);
  const insertionPoint = document.querySelector('meta[name="emotion-insertion-point"]') as Element | null;
  const cache = useMemo(() => createCache({ key: "mui", insertionPoint: insertionPoint || undefined }), [insertionPoint]);
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={themeObj}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}

export function ThemeToggleButton() {
  const { theme, setTheme } = useUI();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const cycle = () => {
    // Always flip the visible mode on click; avoid a no-op when theme is 'system'
    const currentIsDark = theme === "dark" || (theme === "system" && prefersDark);
    setTheme(currentIsDark ? "light" : "dark");
  };
  const currentIsDark = theme === "dark" || (theme === "system" && prefersDark);
  const icon = currentIsDark ? <DarkModeIcon /> : <LightModeIcon />;
  return <IconButton color="inherit" onClick={cycle} title={`Theme: ${theme}`}>{icon}</IconButton>;
}
