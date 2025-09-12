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
import Media from "@/pages/Media";
import Schools from "@/pages/Schools";
import ProcessDetail from "@/pages/ProcessDetail";
import MemberDetail from "@/pages/MemberDetail";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/stores/auth";
import { ThemeContainer } from "@/theme";
import { useEffect } from "react";
import { whoami } from "@/lib/api";

function Authed({ children }: { children: JSX.Element }) {
  const { user, setSession, clear } = useAuth();
  useEffect(() => {
    (async () => {
      try {
        const m = await whoami();
        if (m.user && m.user !== "Guest") {
          if (!user || user.name !== m.user) {
            setSession({ name: m.user, full_name: m.full_name }, m.roles || []);
          }
        } else {
          clear();
        }
      } catch {
        clear();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return user ? children : <Login />;
}

const router = createBrowserRouter([
  { path: "/", element: <AppLayout><Authed><Dashboard /></Authed></AppLayout> },
  { path: "/processes", element: <AppLayout><Authed><Processes /></Authed></AppLayout> },
  { path: "/processes/:name", element: <AppLayout><Authed><ProcessDetail /></Authed></AppLayout> },
  { path: "/members/:name", element: <AppLayout><Authed><MemberDetail /></Authed></AppLayout> },
  { path: "/members", element: <AppLayout><Authed><Members /></Authed></AppLayout> },
  { path: "/payments", element: <AppLayout><Authed><Payments /></Authed></AppLayout> },
  { path: "/sponsorships", element: <AppLayout><Authed><Sponsorships /></Authed></AppLayout> },
  { path: "/newcomers", element: <AppLayout><Authed><Newcomers /></Authed></AppLayout> },
  { path: "/volunteers", element: <AppLayout><Authed><Volunteers /></Authed></AppLayout> },
  { path: "/media", element: <AppLayout><Authed><Media /></Authed></AppLayout> },
  { path: "/schools", element: <AppLayout><Authed><Schools /></Authed></AppLayout> },
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
