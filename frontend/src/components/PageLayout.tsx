import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const PageLayout = () => {
  return (
    <div className="min-h-screen dashboard-background flex">
      <Sidebar />
      <div className="flex-1 lg:ml-56 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
