import { PropsWithChildren, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import SchemaIcon from "@mui/icons-material/Schema";
import PeopleIcon from "@mui/icons-material/People";
import PaymentsIcon from "@mui/icons-material/Payments";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import TranslateIcon from "@mui/icons-material/Translate";
import { ThemeToggleButton } from "@/theme";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { logout } from "@/lib/api";
import { t } from "@/lib/i18n";

const DRAWER_W = 280;
const RAIL_W = 72;

const NAV = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/processes", label: "Processes", icon: <SchemaIcon />, permKey: "Workflow Process" },
  { to: "/members", label: "Members", icon: <PeopleIcon />, permKey: "Member" },
  { to: "/payments", label: "Payments", icon: <PaymentsIcon />, permKey: "Payment" },
  { to: "/sponsorships", label: "Sponsorships", icon: <LoyaltyIcon />, permKey: "Sponsorship" },
  { to: "/newcomers", label: "Newcomers", icon: <TravelExploreIcon />, permKey: "Newcomer" },
  { to: "/volunteers", label: "Volunteers", icon: <VolunteerActivismIcon />, permKey: "Volunteer" },
  { to: "/media", label: "Media", icon: <PhotoLibraryIcon />, permKey: "Media Request" },
  { to: "/schools", label: "Schools", icon: <SchoolIcon />, permKey: "School Enrollment" },
] as const;

export default function AppLayout({ children }: PropsWithChildren) {
  const { navOpen, setNavOpen, locale, setLocale, perms } = useUI();
  const { user, roles, clear } = useAuth();
  const isMdUp = useMediaQuery("(min-width:900px)");
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const width = useMemo(() => (isMdUp ? (navOpen ? DRAWER_W : RAIL_W) : 0), [isMdUp, navOpen]);

  async function doLogout() { try { await logout(); } catch {} clear(); window.location.href = "/"; }

  const DrawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" noWrap>{navOpen ? "Salite One" : "S1"}</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1 }}>
        {NAV.filter(i => !("permKey" in i) || (i as any).permKey == null || perms[(i as any).permKey as string])
          .map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={isActive(item.to)}
            sx={{ px: navOpen ? 2 : 1.2, justifyContent: navOpen ? "initial" : "center" }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: navOpen ? 2 : "auto" }}>{item.icon}</ListItemIcon>
            {navOpen && <ListItemText primary={t(item.label.toLowerCase() as any, locale)} />}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={doLogout} sx={{ px: navOpen ? 2 : 1.2, justifyContent: navOpen ? "initial" : "center" }}>
          <ListItemIcon sx={{ minWidth: 0, mr: navOpen ? 2 : "auto" }}><LogoutIcon /></ListItemIcon>
          {navOpen && <ListItemText primary="Sign out" />}
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar position="fixed" elevation={0} color="default"
              sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, ml: isMdUp ? `${width}px` : 0 }}>
        <Toolbar>
          {isMdUp && (
            <IconButton edge="start" color="inherit" onClick={() => setNavOpen(!navOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>Dashboard</Typography>

          <IconButton color="inherit" onClick={() => setLocale(locale === "en" ? "am" : "en")} title="Language">
            <TranslateIcon />
          </IconButton>
          {roles?.[0] && <Chip size="small" label={roles[0]} sx={{ mx: 1 }} />}
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      {isMdUp ? (
        <Drawer
          variant="permanent"
          PaperProps={{ sx: { width, overflowX: "hidden", transition: "width .2s ease" } }}
          open
        >
          {DrawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={navOpen}
          onClose={() => setNavOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: DRAWER_W } }}
        >
          {DrawerContent}
        </Drawer>
      )}

      {/* Page content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: "64px", ml: isMdUp ? `${width}px` : 0 }}>
        {children}
      </Box>
    </Box>
  );
}
