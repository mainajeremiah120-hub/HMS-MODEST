import { useState, useEffect } from "react";
import API from "../api/axios";

function Appointments() {
  const [appointmentList, setAppointmentList] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    duration: 30,
    reason: "",
    isRecurring: false,
    recurringInterval: "",
    recurringEndDate: "",
  });

  const fetchAppointments = async () => {
    try {
      const res = await API.get("/appointments");
      setAppointmentList(res.data);
    } catch (err) {
      setError("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await API.get("/patients");
      setPatientList(res.data);
    } catch (err) {
      console.error("Failed to fetch patients");
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/staff");
      const doctors = res.data.staff.filter((s) => s.role === "doctor");
      setDoctorList(doctors);
    } catch (err) {
      console.error("Failed to fetch doctors");
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleAdd = () => {
    setSelectedAppointment(null);
    setFormData({
      patient: "",
      doctor: "",
      appointmentDate: "",
      appointmentTime: "",
      duration: 30,
      reason: "",
      isRecurring: false,
      recurringInterval: "",
      recurringEndDate: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await API.post("/appointments", formData);
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/appointments/${id}/approve`);
      fetchAppointments();
    } catch (err) {
      setError("Failed to approve appointment");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/appointments/${id}/reject`);
      fetchAppointments();
    } catch (err) {
      setError("Failed to reject appointment");
    }
  };

  const handleComplete = async (id) => {
    try {
      await API.put(`/appointments/${id}/complete`);
      fetchAppointments();
    } catch (err) {
      setError("Failed to complete appointment");
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async () => {
    try {
      await API.put(`/appointments/${selectedAppointment._id}/cancel`, {
        cancellationReason,
      });
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err) {
      setError("Failed to cancel appointment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await API.delete(`/appointments/${id}`);
      fetchAppointments();
    } catch (err) {
      setError("Failed to delete appointment");
    }
  };

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-orange-100 text-orange-700",
    missed: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + New Appointment
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading appointments...</div>
        ) : appointmentList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No appointments found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Duration</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointmentList.map((appt) => (
                <tr key={appt._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {appt.patient?.fullName || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {appt.doctor?.fullName || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(appt.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{appt.appointmentTime}</td>
                  <td className="px-6 py-4 text-gray-600">{appt.duration} mins</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[appt.status]}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {/* Doctor actions */}
                      {(user?.role === "doctor" || user?.role === "admin") &&
                        appt.status === "scheduled" && (
                          <>
                            <button
                              onClick={() => handleApprove(appt._id)}
                              className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(appt._id)}
                              className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      {(user?.role === "doctor" || user?.role === "admin") &&
                        appt.status === "approved" && (
                          <button
                            onClick={() => handleComplete(appt._id)}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200 transition"
                          >
                            Complete
                          </button>
                        )}
                      {["scheduled", "approved"].includes(appt.status) && (
                        <button
                          onClick={() => handleCancelClick(appt)}
                          className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs hover:bg-orange-200 transition"
                        >
                          Cancel
                        </button>
                      )}
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(appt._id)}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">New Appointment</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  name="patient"
                  value={formData.patient}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select patient</option>
                  {patientList.map((p) => (
                    <option key={p._id} value={p._id}>{p.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select doctor</option>
                  {doctorList.map((d) => (
                    <option key={d._id} value={d._id}>{d.fullName} — {d.department}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleChange}
                  id="isRecurring"
                  className="w-4 h-4"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Recurring Appointment
                </label>
              </div>

              {formData.isRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Interval</label>
                    <select
                      name="recurringInterval"
                      value={formData.recurringInterval}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select interval</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurring End Date</label>
                    <input
                      type="date"
                      name="recurringEndDate"
                      value={formData.recurringEndDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create
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

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Cancel Appointment</h2>
            <p className="text-gray-600 text-sm mb-4">
              Please provide a reason for cancelling this appointment.
            </p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              placeholder="Cancellation reason..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCancelSubmit}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;