import { NavLink, useNavigate } from "react-router-dom";


const adminLinks = [
  { path: "/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/staff", label: "Staff", icon: "👨‍⚕️" },
  { path: "/patients", label: "Patients", icon: "🏥" },
  { path: "/appointments", label: "Appointments", icon: "📅" },
  { path: "/clinical", label: "Clinical", icon: "🩺" },
  { path: "/reception", label: "Reception", icon: "🏨" },
  { path: "/lab", label: "Laboratory", icon: "🧪" },
  { path: "/pharmacy", label: "Pharmacy", icon: "💊" },
  { path: "/billing", label: "Billing / Cashier", icon: "💵" }, 
  { path: "/revenue", label: "Revenue", icon: "💰" }
];

const receptionLinks = [
  { path: "/reception", label: "Reception", icon: "🏠" },
  { path: "/patients", label: "Patients", icon: "🏥" },
  { path: "/appointments", label: "Appointments", icon: "📅" },
  { path: "/billing", label: "Billing / Cashier", icon: "💵" }, 
];

const cashierLinks = [
  { path: "/billing", label: "Billing / Cashier", icon: "💵" }, 
];

const doctorLinks = [
  { path: "/clinical", label: "Clinical", icon: "🩺" },
  { path: "/appointments", label: "My Appointments", icon: "📅" },
];

const nurseLinks = [
  { path: "/ward", label: "Ward", icon: "🛏️" },
];

const pharmacyLinks = [
  { path: "/pharmacy", label: "Pharmacy", icon: "💊" },
];

const labLinks = [
  { path: "/lab", label: "Laboratory", icon: "🧪" },
];

const roleLinks = {
  admin: adminLinks,
  receptionist: receptionLinks,
  cashier: cashierLinks, // 👈 Registered here
  doctor: doctorLinks,
  nurse: nurseLinks,
  pharmacist: pharmacyLinks,
  lab: labLinks,
};

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const links = roleLinks[user?.role] || [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    // 1. Added 'sticky top-0 h-screen' to pin the sidebar to the viewport
    // 2. Used 'flex-col' to create the vertical stack
    <div className="sticky top-0 h-screen bg-blue-800 text-white flex flex-col w-64">
      
      {/* Header & User Info (Fixed at top) */}
      <div className="flex-shrink-0">
        <div className="px-6 py-5 border-b border-blue-700">
          <h1 className="text-2xl font-bold">HMS</h1>
          <p className="text-blue-300 text-sm">Hospital Management</p>
        </div>
        <div className="px-6 py-4 border-b border-blue-700">
          <p className="text-white font-medium">{user?.fullName}</p>
          <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Nav Links: 'flex-1' and 'overflow-y-auto' 
        This section will grow to fill available space and scroll if content exceeds it 
      */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-white text-blue-800 font-semibold"
                  : "text-blue-200 hover:bg-white hover:text-blue-800"
              }`
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout (Pinned to the bottom via flex-col order) */}
      <div className="px-4 py-4 border-t border-blue-700 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;