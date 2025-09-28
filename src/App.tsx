import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorBoundary from "@/pages/ErrorBoundary";
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
import VolunteerHub from "@/pages/VolunteerHub";
import VolunteerDetail from "@/pages/VolunteerDetail";
import VolunteerBulkUpload from "@/pages/VolunteerBulkUpload";
import Media from "@/pages/Media";
import Schools from "@/pages/Schools";
import ProcessDetail from "@/pages/ProcessDetail";
import MemberDetail from "@/pages/MemberDetail";
import MembersBulkUpload from "@/pages/MembersBulkUpload";
import Membership from "@/pages/Membership";
import Requests from "@/pages/Requests";
import TeamGroup from "@/pages/TeamGroup";
import TeamApprovals from "@/pages/TeamApprovals";
import TeamTasks from "@/pages/TeamTasks";
import TeamReports from "@/pages/TeamReports";
import FinanceDashboard from "@/pages/FinanceDashboard";
import Reports from "@/pages/Reports";
import AdminDashboard from "@/pages/AdminDashboard";
import Notifications from "@/pages/Notifications";
import Approvals from "@/pages/Approvals";
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
          // Do not immediately clear; allow user to re-auth without kicking
          // clear();
        }
      } catch {
        // Be tolerant to transient errors here; keep session intact
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
  { path: "/", element: <AuthedLayout><Dashboard /></AuthedLayout>, errorElement: <ErrorBoundary><Login /></ErrorBoundary> },
  { path: "/processes", element: <AuthedLayout><Processes /></AuthedLayout> },
  { path: "/processes/:name", element: <AuthedLayout><ProcessDetail /></AuthedLayout> },
  { path: "/members/:name", element: <AuthedLayout><MemberDetail /></AuthedLayout> },
  { path: "/members", element: <AuthedLayout><Members /></AuthedLayout> },
  { path: "/members/bulk-upload", element: <AuthedLayout><MembersBulkUpload /></AuthedLayout> },
  { path: "/payments", element: <AuthedLayout><Payments /></AuthedLayout> },
  { path: "/sponsorships", element: <AuthedLayout><Sponsorships /></AuthedLayout> },
  { path: "/newcomers", element: <AuthedLayout><Newcomers /></AuthedLayout> },
  { path: "/membership", element: <AuthedLayout><Membership /></AuthedLayout>, errorElement: <ErrorBoundary><Login /></ErrorBoundary> },
  { path: "/requests", element: <AuthedLayout><Requests /></AuthedLayout> },
  { path: "/volunteers", element: <AuthedLayout><VolunteerHub /></AuthedLayout> },
  { path: "/volunteers/admin", element: <AuthedLayout><Volunteers /></AuthedLayout> },
  { path: "/volunteers/:volunteerId", element: <AuthedLayout><VolunteerDetail /></AuthedLayout> },
  { path: "/volunteers/bulk-upload", element: <AuthedLayout><VolunteerBulkUpload /></AuthedLayout> },
  { path: "/team/group", element: <AuthedLayout><TeamGroup /></AuthedLayout> },
  { path: "/team/tasks", element: <AuthedLayout><TeamTasks /></AuthedLayout> },
  { path: "/team/approvals", element: <AuthedLayout><TeamApprovals /></AuthedLayout> },
  { path: "/team/reports", element: <AuthedLayout><TeamReports /></AuthedLayout> },
  { path: "/finance", element: <AuthedLayout><FinanceDashboard /></AuthedLayout> },
  { path: "/reports", element: <AuthedLayout><Reports /></AuthedLayout> },
  { path: "/admin", element: <AuthedLayout><AdminDashboard /></AuthedLayout> },
  { path: "/notifications", element: <AuthedLayout><Notifications /></AuthedLayout> },
  { path: "/approvals", element: <AuthedLayout><Approvals /></AuthedLayout> },
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
