import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const PageLayout = () => {
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  return (
    <div className="min-h-screen dashboard-background flex">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}
      >
        <TopBar />
        <main className="flex-1 overflow-auto p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
