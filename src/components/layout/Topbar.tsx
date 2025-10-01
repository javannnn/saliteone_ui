import { useMemo, useState } from "react";
import Button from "@/components/ui/button";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { t } from "@/lib/i18n";
import { logout as apiLogout } from "@/lib/api";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { user, clear } = useAuth();
  const { locale, setLocale } = useUI();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  async function doLogout() {
    try { await apiLogout(); } catch {}
    clear();
    window.location.href = "/";
  }

  const initials = useMemo(() => {
    if (!user?.full_name) return user?.name?.[0]?.toUpperCase() || "U";
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [user?.full_name, user?.name]);

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/70 px-4 backdrop-blur dark:bg-zinc-900/70">
      <div className="font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Salite One</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-zinc-500">{t("language", locale)}:</span>
          <Button size="sm" variant={locale==="en"?"default":"outline"} onClick={()=>setLocale("en")}>EN</Button>
          <Button size="sm" variant={locale==="am"?"default":"outline"} onClick={()=>setLocale("am")}>AM</Button>
        </div>
        {user ? (
          <Tooltip title={user.full_name} arrow>
            <IconButton
              onClick={(event) => setAnchorEl(event.currentTarget)}
              size="small"
              sx={{
                transition: "transform .18s ease",
                '&:hover': { transform: 'scale(1.04)' },
                '& .MuiAvatar-root': {
                  background: 'linear-gradient(135deg, #2563eb, #9333ea)',
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                },
              }}
            >
              <Avatar sx={{ width: 36, height: 36 }}>{initials}</Avatar>
            </IconButton>
          </Tooltip>
        ) : null}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            {user?.full_name || user?.name}
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/membership'); }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Account Settings
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); window.location.href = '/update-password'; }}>
            <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
            Change Password
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={() => { setAnchorEl(null); doLogout(); }}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}
