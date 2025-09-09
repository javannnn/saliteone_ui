import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Processes from "@/pages/Processes";
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
  { path: "*", element: <NotFound /> }
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
