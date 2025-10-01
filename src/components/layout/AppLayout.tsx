import { PropsWithChildren, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
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
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GroupIcon from "@mui/icons-material/Group";
import GroupsIcon from "@mui/icons-material/Groups";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import BarChartIcon from "@mui/icons-material/BarChart";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LogoutIcon from "@mui/icons-material/Logout";
import TranslateIcon from "@mui/icons-material/Translate";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import { ThemeToggleButton } from "@/theme";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { logout } from "@/lib/api";
import { tSafe } from "@/lib/i18n";
import Badge from "@mui/material/Badge";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Popover from "@mui/material/Popover";
import ListItem from "@mui/material/ListItem";
// removed unused ListItemSecondaryAction
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import { useQuery } from "@tanstack/react-query";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import CommandPalette from "@/components/ui/CommandPalette";
import SearchIcon from "@mui/icons-material/Search";
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import QuickActions from "@/components/ui/QuickActions";

const DRAWER_W = 280;
const RAIL_W = 72;

type NavItem = { to: string; label: string; icon: JSX.Element; permKey?: string; rolesAllowed?: string[] };
const NAV: ReadonlyArray<NavItem> = [
  // General
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/membership", label: "My Membership", icon: <ManageAccountsIcon />, rolesAllowed: ["Member","Volunteer","Team Leader"] },
  { to: "/requests", label: "Requests", icon: <AssignmentIcon />, rolesAllowed: ["Member","Volunteer","Team Leader"] },

  // Volunteers
  { to: "/volunteers", label: "Volunteer Hub", icon: <VolunteerActivismIcon />, rolesAllowed: ["Volunteer","Team Leader"] },
  { to: "/volunteers/admin", label: "Volunteer administration", icon: <GroupsIcon />, rolesAllowed: ["Admin", "Volunteer Admin"] },
  { to: "/volunteers/bulk-upload", label: "Bulk Upload", icon: <UploadFileIcon />, rolesAllowed: ["Admin", "Volunteer Admin"] },

  // Team Leader specific
    { to: "/team/group", label: "Group Management", icon: <GroupIcon />, rolesAllowed: ["Team Leader"] },
    { to: "/team/tasks", label: "Tasks", icon: <AssignmentTurnedInIcon />, rolesAllowed: ["Team Leader"] },
    { to: "/team/approvals", label: "Approvals", icon: <PendingActionsIcon />, rolesAllowed: ["Team Leader"] },
  { to: "/team/reports", label: "Group Reports", icon: <LibraryBooksIcon />, rolesAllowed: ["Team Leader"] },

  // Admin / Finance / Media
  { to: "/members", label: "Members Directory", icon: <PeopleIcon />, rolesAllowed: ["Admin"] },
  { to: "/members/bulk-upload", label: "Members Bulk Upload", icon: <PeopleIcon />, rolesAllowed: ["Admin"] },
  { to: "/newcomers", label: "Newcomers", icon: <TravelExploreIcon />, rolesAllowed: ["Admin"] },
  { to: "/sponsorships", label: "Sponsorships", icon: <LoyaltyIcon />, rolesAllowed: ["Admin"] },
  { to: "/payments", label: "Payments & Tithes", icon: <PaymentsIcon />, rolesAllowed: ["Admin","Finance Admin"] },
  { to: "/finance", label: "Finance Dashboard", icon: <BarChartIcon />, rolesAllowed: ["Finance Admin"] },
  { to: "/reports", label: "Reports", icon: <BarChartIcon />, rolesAllowed: ["Admin","Finance Admin"] },
  { to: "/admin", label: "Admin Dashboard", icon: <BarChartIcon />, rolesAllowed: ["Admin"] },
  { to: "/schools", label: "Schools", icon: <SchoolIcon />, rolesAllowed: ["Admin"] },
  { to: "/sunday-school", label: "Sunday School", icon: <ChildCareIcon />, rolesAllowed: ["Admin","Media Admin","Finance Admin","Volunteer Admin"], permKey: "Sunday School Member" },
  { to: "/media/admin", label: "Media Admin", icon: <PhotoLibraryIcon />, rolesAllowed: ["Media Admin","Admin"] },
  { to: "/settings", label: "System Settings", icon: <SettingsIcon />, rolesAllowed: ["Admin","Super Admin"] },
];

function keyFromLabel(lbl: string) {
  return lbl.toLowerCase().replace(/\s+/g, "_");
}

export default function AppLayout({ children }: PropsWithChildren) {
  const { navOpen, setNavOpen, locale, setLocale, perms } = useUI();
  const { user, roles, clear } = useAuth();
  const isMdUp = useMediaQuery("(min-width:900px)");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  // Notifications (unread count)
  const notifQ = useQuery({ queryKey: ["notifs", "header"], queryFn: () => listMyNotifications(20), staleTime: 30_000 });
  const unread = (notifQ.data || []).filter((n: any) => !n.read).length;

  const width = useMemo(() => (isMdUp ? (navOpen ? DRAWER_W : RAIL_W) : 0), [isMdUp, navOpen]);

  async function doLogout() { try { await logout(); } catch {} clear(); window.location.href = "/"; }

  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const profileOpen = Boolean(profileAnchor);

  const initials = useMemo(() => {
    if (!user?.full_name) return user?.name?.[0]?.toUpperCase() || "U";
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [user?.full_name, user?.name]);

  const [cmdOpen, setCmdOpen] = useState(false);
  const makeNavButton = (item: NavItem) => (
    <ListItemButton
      key={item.to}
      selected={isActive(item.to)}
      onClick={() => {
        navigate(item.to);
        if (!isMdUp) setNavOpen(false);
      }}
      sx={{ px: navOpen ? 2 : 1.2, justifyContent: navOpen ? "initial" : "center" }}
    >
      <ListItemIcon sx={{ minWidth: 0, mr: navOpen ? 2 : "auto" }}>{item.icon}</ListItemIcon>
      {navOpen && <ListItemText primary={tSafe(keyFromLabel(item.label), locale, item.label)} />}
    </ListItemButton>
  );

  const DrawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" noWrap>{navOpen ? "Salite One" : "S1"}</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1 }} subheader={navOpen ? <ListSubheader disableSticky>General</ListSubheader> : undefined}>
        {NAV.filter(i => ["/","/membership","/requests","/notifications"].includes(i.to))
          .filter((item)=>{ const permOk=!item.permKey||perms[item.permKey]; const roleOk=!item.rolesAllowed||item.rolesAllowed.some(r=>(roles||[]).includes(r)); return permOk&&roleOk; })
          .map(makeNavButton)}
        {navOpen && <ListSubheader disableSticky>Volunteer</ListSubheader>}
        {NAV.filter(i => ["/volunteers"].includes(i.to))
          .filter((item)=>{ const permOk=!item.permKey||perms[item.permKey]; const roleOk=!item.rolesAllowed||item.rolesAllowed.some(r=>(roles||[]).includes(r)); return permOk&&roleOk; })
          .map(makeNavButton)}
        {navOpen && <ListSubheader disableSticky>Volunteer Admin</ListSubheader>}
        {NAV.filter(i => ["/volunteers/admin","/volunteers/bulk-upload"].includes(i.to))
          .filter((item)=>{ const permOk=!item.permKey||perms[item.permKey]; const roleOk=!item.rolesAllowed||item.rolesAllowed.some(r=>(roles||[]).includes(r)); return permOk&&roleOk; })
          .map(makeNavButton)}
        {navOpen && <ListSubheader disableSticky>Team Leader</ListSubheader>}
        {NAV.filter(i => ["/team/group","/team/approvals","/team/reports"].includes(i.to))
          .filter((item)=>{ const permOk=!item.permKey||perms[item.permKey]; const roleOk=!item.rolesAllowed||item.rolesAllowed.some(r=>(roles||[]).includes(r)); return permOk&&roleOk; })
          .map(makeNavButton)}
        {navOpen && <ListSubheader disableSticky>Admin Tools</ListSubheader>}
        {NAV.filter(i => ["/approvals","/admin","/members","/newcomers","/sponsorships","/payments","/finance","/reports","/schools","/sunday-school","/media/admin","/settings"].includes(i.to))
          .filter((item)=>{ const permOk=!item.permKey||perms[item.permKey]; const roleOk=!item.rolesAllowed||item.rolesAllowed.some(r=>(roles||[]).includes(r)); return permOk&&roleOk; })
          .map(makeNavButton)}
      </List>
    </Box>
  );

  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const notifOpen = Boolean(notifAnchor);

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
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>{(NAV.find(n => n.to === pathname)?.label) || "Dashboard"}</Typography>
            <Breadcrumbs maxItems={3} itemsBeforeCollapse={2} sx={{ fontSize: 12 }}>
              <Link to="/">Home</Link>
              {pathname.split('/').filter(Boolean).map((seg, idx, arr)=> {
                const to = '/' + arr.slice(0, idx+1).join('/');
                const label = NAV.find(n => n.to === to)?.label || seg;
                return <Link key={to} to={to}>{label}</Link>;
              })}
            </Breadcrumbs>
          </Box>
          <IconButton color="inherit" onClick={()=> setCmdOpen(true)} title="Search (Ctrl+K)">
            <SearchIcon />
          </IconButton>

          <IconButton color="inherit" onClick={() => setLocale(locale === "en" ? "am" : "en")} title="Language">
            <TranslateIcon />
          </IconButton>
          <IconButton color="inherit" onClick={(e)=> setNotifAnchor(e.currentTarget)} title="Notifications">
            <Badge color="error" badgeContent={unread} invisible={unread===0}>
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          <Popover
            open={notifOpen}
            anchorEl={notifAnchor}
            onClose={()=> setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, p: 1 } }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.5 }}>
              <Typography variant="subtitle2">Notifications</Typography>
              <IconButton size="small" onClick={()=> setNotifAnchor(null)}><CloseIcon fontSize="small"/></IconButton>
            </Stack>
            <Divider />
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(notifQ.data || []).slice(0,8).map((n:any)=> (
                <ListItem key={n.name} sx={{ py: 0.5 }} secondaryAction={!n.read && (
                  <Button size="small" onClick={async ()=>{ await markNotificationRead(n.name); notifQ.refetch(); }}>Mark</Button>
                )}>
                  <ListItemText primary={n.subject} secondary={n.email_content} />
                </ListItem>
              ))}
              {(!notifQ.data || notifQ.data.length === 0) && (
                <ListItem><ListItemText primary="No notifications" /></ListItem>
              )}
            </List>
            <Divider />
            <Stack direction="row" justifyContent="space-between" sx={{ p: 1 }}>
              <Button size="small" onClick={()=>{ setNotifAnchor(null); navigate('/notifications'); }}>Open inbox</Button>
              <Button size="small" onClick={async ()=>{ await markAllNotificationsRead(); notifQ.refetch(); }}>Mark all read</Button>
            </Stack>
          </Popover>
          {roles?.[0] && <Chip size="small" label={roles[0]} sx={{ mx: 1 }} />}
          <ThemeToggleButton />
          {user && (
            <>
              <Tooltip title={user.full_name} arrow>
                <IconButton
                  onClick={(event) => setProfileAnchor(event.currentTarget)}
                  size="small"
                  sx={{
                    ml: 1,
                    transition: "transform .2s ease",
                    '&:hover': { transform: 'scale(1.05)' },
                    '& .MuiAvatar-root': {
                      background: 'linear-gradient(135deg,#2563eb,#9333ea)',
                      color: '#fff',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      boxShadow: '0 8px 20px rgba(79,70,229,.28)',
                    },
                  }}
                >
                  <Avatar sx={{ width: 34, height: 34 }}>{initials}</Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={profileAnchor}
                open={profileOpen}
                onClose={() => setProfileAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
              >
                <MenuItem disabled>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  {user.full_name || user.name}
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { setProfileAnchor(null); navigate('/membership'); }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => { setProfileAnchor(null); navigate('/settings'); }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  Account Settings
                </MenuItem>
                <MenuItem onClick={() => { setProfileAnchor(null); window.location.href = '/update-password'; }}>
                  <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
                  Change Password
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { setProfileAnchor(null); doLogout(); }}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  Sign out
                </MenuItem>
              </Menu>
            </>
          )}
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
      <QuickActions />
      <CommandPalette open={cmdOpen} onClose={()=> setCmdOpen(false)} />
    </Box>
  );
}
