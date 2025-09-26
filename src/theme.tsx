import { PropsWithChildren, useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useUI } from "@/stores/ui";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

function makeTheme(mode: "light" | "dark") {
  const base: any = {
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Roboto Flex, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial',
      h1: { fontSize: 24, fontWeight: 600, lineHeight: 1.3 },
      h2: { fontSize: 20, fontWeight: 600, lineHeight: 1.35 },
      h3: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: 14, lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 16, height: 40 },
          containedPrimary: { boxShadow: "0 2px 6px rgba(0,0,0,.12)" },
        }
      },
      MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 16, boxShadow: "0 6px 18px rgba(0,0,0,.12)" } } },
      MuiAppBar: { styleOverrides: { root: { boxShadow: "0 2px 8px rgba(0,0,0,.08)" } } },
      MuiDrawer: { styleOverrides: { paper: { borderRight: "1px solid #E6E8EB" } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 999 } } },
    },
  };
  return createTheme({
    ...base,
    palette: {
      mode,
      ...(mode === "light"
        ? {
            primary: { main: "#3F51B5" },
            secondary: { main: "#009688" },
            background: { default: "#F7F7F7", paper: "#FFFFFF" },
            text: { primary: "#1C1B1F", secondary: "#4A4A4A" },
          }
        : {
            primary: { main: "#8C9EFF" },
            secondary: { main: "#26A69A" },
            background: { default: "#1E1E1E", paper: "#121212" },
            text: { primary: "#ECECEC", secondary: "#BDBDBD" },
          }),
    },
  });
}

export function ThemeContainer({ children }: PropsWithChildren) {
  const { theme } = useUI();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = (theme === "system" ? (prefersDark ? "dark" : "light") : theme) as "light" | "dark";
  const themeObj = useMemo(() => makeTheme(mode), [mode]);
  return (
    <ThemeProvider theme={themeObj}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function ThemeToggleButton() {
  const { theme, setTheme } = useUI();
  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };
  const icon = theme === "dark" ? <DarkModeIcon /> : <LightModeIcon />;
  return <IconButton color="inherit" onClick={cycle} title={`Theme: ${theme}`}>{icon}</IconButton>;
}
