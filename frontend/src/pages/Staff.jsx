import { useState, useEffect } from "react";
import API from "../api/axios";
import Lab from "./lab";

function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    department: "",
    phone: "",
  });

  // Fetch all staff
  const fetchStaff = async () => {
    try {
      const res = await API.get("/staff");
      setStaffList(res.data.staff);
    } catch (err) {
      setError("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open modal for adding
  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({ fullName: "", email: "", role: "", department: "", phone: "" });
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      phone: staff.phone,
    });
    setShowModal(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await API.put(`/staff/${editingStaff._id}`, formData);
      } else {
        await API.post("/staff", formData);
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  // Delete staff
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await API.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) {
      setError("Failed to delete staff");
    }
  };

  const roleColors = {
  admin: "bg-red-100 text-red-700",
  doctor: "bg-blue-100 text-blue-700",
  nurse: "bg-green-100 text-green-700",
  receptionist: "bg-yellow-100 text-yellow-700",
  lab: "bg-purple-100 text-purple-900",
  pharmacist: "bg-pink-100 text-pink-700",
};

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Add Staff
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading staff...</div>
        ) : staffList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No staff found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map((staff) => (
                <tr key={staff._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{staff.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{staff.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[staff.role]}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{staff.department}</td>
                  <td className="px-6 py-4 text-gray-600">{staff.phone}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(staff)}
                      className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs hover:bg-yellow-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(staff._id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingStaff ? "Edit Staff" : "Add New Staff"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="lab">Lab</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
                   <option value="">Select department</option>
                   <option value="Administration">Administration</option>
                   <option value="reception">Reception</option>
                   <option value="Clinical Consultation">Clinical Consultation</option>
                   <option value="Ward">Ward</option>
                   <option value="Pharmacy">Pharmacy</option>
                   <option value="Laboratory">Laboratory</option>
                   <option value="Radiology">Radiology</option>
                  <option value="cashier">Cashier</option>
                 </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {editingStaff ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;