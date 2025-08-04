import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};