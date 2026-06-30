import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import SyncIndicator from "./SyncIndicator";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <SyncIndicator />
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto pt-6">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
