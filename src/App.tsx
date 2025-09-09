import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toast } from "@/components/ui/toast";
import AppShell from "@/components/layout/AppShell";
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

function Authed({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? children : <Login />;
}

const router = createBrowserRouter([
  { path: "/", element: <AppShell><Authed><Dashboard /></Authed></AppShell> },
  { path: "/processes", element: <AppShell><Authed><Processes /></Authed></AppShell> },
  { path: "/processes/:name", element: <AppShell><Authed><ProcessDetail /></Authed></AppShell> },
  { path: "/members/:name", element: <AppShell><Authed><MemberDetail /></Authed></AppShell> },
  { path: "/members", element: <AppShell><Authed><Members /></Authed></AppShell> },
  { path: "/payments", element: <AppShell><Authed><Payments /></Authed></AppShell> },
  { path: "/sponsorships", element: <AppShell><Authed><Sponsorships /></Authed></AppShell> },
  { path: "/newcomers", element: <AppShell><Authed><Newcomers /></Authed></AppShell> },
  { path: "/volunteers", element: <AppShell><Authed><Volunteers /></Authed></AppShell> },
  { path: "/media", element: <AppShell><Authed><Media /></Authed></AppShell> },
  { path: "/schools", element: <AppShell><Authed><Schools /></Authed></AppShell> },
  { path: "*", element: <NotFound /> }
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toast />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
