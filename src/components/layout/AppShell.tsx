import { PropsWithChildren } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
