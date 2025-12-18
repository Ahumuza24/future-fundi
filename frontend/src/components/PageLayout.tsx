import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const PageLayout = () => {
  return (
    <div className="min-h-screen dashboard-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default PageLayout;
