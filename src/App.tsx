import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toast } from "@/components/ui/toast";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Processes from "@/pages/Processes";
import Members from "@/pages/Members";
import Payments from "@/pages/Payments";
import Sponsorships from "@/pages/Sponsorships";
import Newcomers from "@/pages/Newcomers";
import Volunteers from "@/pages/Volunteers";
import VolunteerDetail from "@/pages/VolunteerDetail";
import VolunteerBulkUpload from "@/pages/VolunteerBulkUpload";
import Media from "@/pages/Media";
import Schools from "@/pages/Schools";
import ProcessDetail from "@/pages/ProcessDetail";
import MemberDetail from "@/pages/MemberDetail";
import RegisterVolunteer from "@/pages/RegisterVolunteer";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";
import { ThemeContainer } from "@/theme";
import { useEffect, useState } from "react";
import { whoami, bootstrapPermissions } from "@/lib/api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

function AuthedLayout({ children }: { children: JSX.Element }) {
  const { user, setSession, clear } = useAuth();
  const { setPerms } = useUI();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await whoami();
        if (m.user && m.user !== "Guest") {
          setSession({ name: m.user, full_name: m.full_name }, m.roles || []);
          const doctypes = [
            "Member","Payment","Sponsorship","Newcomer","Volunteer","Media Request","School Enrollment","Workflow Process"
          ];
          const perms = await bootstrapPermissions(doctypes);
          if (alive) setPerms(perms);
        } else {
          clear();
        }
      } catch {
        clear();
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!ready && !user) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (!user) return <Login />;
  return <AppLayout>{children}</AppLayout>;
}

const router = createBrowserRouter([
  { path: "/", element: <AuthedLayout><Dashboard /></AuthedLayout> },
  { path: "/processes", element: <AuthedLayout><Processes /></AuthedLayout> },
  { path: "/processes/:name", element: <AuthedLayout><ProcessDetail /></AuthedLayout> },
  { path: "/members/:name", element: <AuthedLayout><MemberDetail /></AuthedLayout> },
  { path: "/members", element: <AuthedLayout><Members /></AuthedLayout> },
  { path: "/payments", element: <AuthedLayout><Payments /></AuthedLayout> },
  { path: "/sponsorships", element: <AuthedLayout><Sponsorships /></AuthedLayout> },
  { path: "/newcomers", element: <AuthedLayout><Newcomers /></AuthedLayout> },
  { path: "/volunteers", element: <AuthedLayout><Volunteers /></AuthedLayout> },
  { path: "/volunteers/:volunteerId", element: <AuthedLayout><VolunteerDetail /></AuthedLayout> },
  { path: "/volunteers/bulk-upload", element: <AuthedLayout><VolunteerBulkUpload /></AuthedLayout> },
  { path: "/media", element: <AuthedLayout><Media /></AuthedLayout> },
  { path: "/schools", element: <AuthedLayout><Schools /></AuthedLayout> },
  { path: "/register/volunteer", element: <RegisterVolunteer /> },
  { path: "*", element: <NotFound /> }
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContainer>
        <Toast />
        <RouterProvider router={router} />
      </ThemeContainer>
    </QueryClientProvider>
  );
}
