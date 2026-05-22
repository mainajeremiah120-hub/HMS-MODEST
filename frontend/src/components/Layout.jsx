import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    // 1. Removed h-screen and overflow-hidden to allow the entire page to scroll naturally
    <div className="flex min-h-screen"> 
      
      {/* Sidebar container will now scroll with the page */}
      <div className="no-print w-64">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="no-print">
          <Navbar />
        </div>
        
        {/* 2. Removed overflow-y-auto so the main content scrolls with the page */}
        <main className="p-6 bg-gray-100 flex-1"> 
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;