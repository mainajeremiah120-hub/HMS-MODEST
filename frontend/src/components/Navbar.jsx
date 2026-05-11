function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-700">
        Welcome back, {user?.fullName} 
      </h2>
      <div className="flex items-center gap-3">
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {user?.role}
        </span>
      </div>
    </div>
  );
}

export default Navbar;