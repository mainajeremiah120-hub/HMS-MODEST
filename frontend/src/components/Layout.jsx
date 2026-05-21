import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex min-h-screen">
      <div className="no-print">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="no-print">
          <Navbar />
        </div>
        <main className="p-6 bg-gray-100 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;