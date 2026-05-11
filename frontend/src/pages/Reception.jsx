import { useState, useEffect } from "react";
import API from "../api/axios";

// ==================== PATIENTS TAB ====================
function PatientsTab() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [doctorList, setDoctorList] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "", dateOfBirth: "", gender: "", phone: "",
    email: "", address: "", bloodGroup: "", assignedDoctor: "",
  });

  const fetchDoctors = async () => {
    const res = await API.get("/staff");
    setDoctorList(res.data.staff.filter((s) => s.role === "doctor"));
  };

  const searchPatients = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reception/patients?search=${search}`);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPatients();
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/reception/patients", formData);
      setShowModal(false);
      searchPatients();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register patient");
    }
  };

  const handleViewProfile = async (id) => {
    const res = await API.get(`/reception/patients/${id}`);
    setShowProfile(res.data);
  };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search by name, phone or email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchPatients()} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button onClick={searchPatients} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Search</button>
        <button onClick={() => setShowModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">+ Register</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Searching...</div>
        ) : patients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No patients found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Gender</th>
                <th className="px-6 py-3 text-left">Blood Group</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{p.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                  <td className="px-6 py-4 capitalize text-gray-600">{p.gender}</td>
                  <td className="px-6 py-4 text-gray-600">{p.bloodGroup || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{p.assignedDoctor?.fullName || "—"}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleViewProfile(p._id)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs hover:bg-blue-200 transition">View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Register New Patient</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Full Name", name: "fullName", type: "text" },
                { label: "Phone", name: "phone", type: "text" },
                { label: "Email", name: "email", type: "email" },
                { label: "Address", name: "address", type: "text" },
                { label: "Date of Birth", name: "dateOfBirth", type: "date" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type={field.type} name={field.name} value={formData[field.name]} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} required={["fullName", "phone", "dateOfBirth"].includes(field.name)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor</label>
                <select name="assignedDoctor" value={formData.assignedDoctor} onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select doctor</option>
                  {doctorList.map((d) => (
                    <option key={d._id} value={d._id}>{d.fullName} — {d.department}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">Register</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Patient Profile</h2>
            <div className="space-y-2 mb-6">
              <p><span className="font-medium">Name:</span> {showProfile.patient.fullName}</p>
              <p><span className="font-medium">Phone:</span> {showProfile.patient.phone}</p>
              <p><span className="font-medium">Email:</span> {showProfile.patient.email || "—"}</p>
              <p><span className="font-medium">Gender:</span> {showProfile.patient.gender}</p>
              <p><span className="font-medium">Blood Group:</span> {showProfile.patient.bloodGroup || "—"}</p>
              <p><span className="font-medium">Doctor:</span> {showProfile.patient.assignedDoctor?.fullName || "—"}</p>
            </div>
            <h3 className="font-bold text-gray-700 mb-3">Appointment History</h3>
            {showProfile.appointments.length === 0 ? (
              <p className="text-gray-500 text-sm">No appointments yet</p>
            ) : (
              <div className="space-y-2">
                {showProfile.appointments.map((a) => (
                  <div key={a._id} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p><span className="font-medium">Date:</span> {new Date(a.appointmentDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Doctor:</span> {a.doctor?.fullName}</p>
                    <p><span className="font-medium">Status:</span> {a.status}</p>
                    <p><span className="font-medium">Reason:</span> {a.reason}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowProfile(null)} className="mt-6 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== APPOINTMENTS TAB ====================
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patientList, setPatientList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [formData, setFormData] = useState({
    patient: "", doctor: "", appointmentDate: "",
    appointmentTime: "", duration: 30, reason: "",
  });

  const fetchToday = async () => {
    try {
      const res = await API.get("/reception/appointments/today");
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsAndDoctors = async () => {
    const [pRes, sRes] = await Promise.all([API.get("/patients"), API.get("/staff")]);
    setPatientList(pRes.data);
    setDoctorList(sRes.data.staff.filter((s) => s.role === "doctor"));
  };

  useEffect(() => {
    fetchToday();
    fetchPatientsAndDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/reception/appointments", formData);
      setShowModal(false);
      fetchToday();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to book appointment");
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Today's Appointments</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">+ Book Appointment</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No appointments today</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Duration</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{a.patient?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{a.doctor?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{a.appointmentTime}</td>
                  <td className="px-6 py-4 text-gray-600">{a.duration} mins</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Book Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select patient</option>
                  {patientList.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select doctor</option>
                  {doctorList.map((d) => <option key={d._id} value={d._id}>{d.fullName} — {d.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={formData.appointmentTime} onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Book</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== QUEUE TAB ====================
function QueueTab() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patientList, setPatientList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [formData, setFormData] = useState({ patient: "", doctor: "", notes: "" });

  const fetchQueue = async () => {
    try {
      const res = await API.get("/reception/queue");
      setQueue(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsAndDoctors = async () => {
    const [pRes, sRes] = await Promise.all([API.get("/patients"), API.get("/staff")]);
    setPatientList(pRes.data);
    setDoctorList(sRes.data.staff.filter((s) => s.role === "doctor"));
  };

  useEffect(() => {
    fetchQueue();
    fetchPatientsAndDoctors();
  }, []);

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      await API.post("/reception/queue/checkin", formData);
      setShowModal(false);
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to check in patient");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/reception/queue/${id}/status`, { status });
      fetchQueue();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const statusColors = {
    waiting: "bg-yellow-100 text-yellow-700",
    being_seen: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    no_show: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Queue — Today</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">+ Check In Patient</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No patients in queue</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.map((q) => (
                <tr key={q._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-blue-700">{q.queueNumber}</td>
                  <td className="px-6 py-4 font-medium">{q.patient?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{q.doctor?.fullName || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[q.status]}`}>
                      {q.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {q.status === "waiting" && (
                        <button onClick={() => handleStatusUpdate(q._id, "being_seen")} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200">Being Seen</button>
                      )}
                      {q.status === "being_seen" && (
                        <button onClick={() => handleStatusUpdate(q._id, "done")} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200">Done</button>
                      )}
                      {q.status === "waiting" && (
                        <button onClick={() => handleStatusUpdate(q._id, "no_show")} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200">No Show</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Check In Patient</h2>
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select patient</option>
                  {patientList.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor (optional)</label>
                <select value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select doctor</option>
                  {doctorList.map((d) => <option key={d._id} value={d._id}>{d.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Check In</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== VISITORS TAB ====================
function VisitorsTab() {
  const [showVisitorProfile, setShowVisitorProfile] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketResult, setTicketResult] = useState(null);
  const [formData, setFormData] = useState({ fullName: "", phone: "", gender: "", reason: "" });

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/reception/visitors/today");
      setVisitors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/reception/visitors", formData);
      setShowModal(false);
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register visitor");
    }
  };

  const handleTicketSearch = async () => {
    try {
      const res = await API.get(`/reception/visitors/${ticketSearch}`);
      setTicketResult(res.data);
    } catch (err) {
      alert("Visitor not found");
    }
  };

  const handleVisitorStatus = async (id, status) => {
    try {
      await API.put(`/reception/visitors/${id}/status`, { status });
      fetchVisitors();
    } catch (err) {
      alert("Failed to update visitor status");
    }
  };

  const statusColors = {
    waiting: "bg-yellow-100 text-yellow-700",
    being_seen: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Walk-in Visitors — Today</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">+ Register Visitor</button>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search by ticket number e.g. VIS-20260502-001" value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button onClick={handleTicketSearch} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">Find</button>
      </div>

      {ticketResult && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm">
          <p><span className="font-medium">Name:</span> {ticketResult.fullName}</p>
          <p><span className="font-medium">Ticket:</span> {ticketResult.ticketNumber}</p>
          <p><span className="font-medium">Reason:</span> {ticketResult.reason}</p>
          <p><span className="font-medium">Status:</span> {ticketResult.status}</p>
          <button onClick={() => setTicketResult(null)} className="mt-2 text-xs text-red-500 hover:underline">Clear</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : visitors.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No visitors today</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Ticket</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Reason</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map((v) => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-700">{v.ticketNumber}</td>
                  <td className="px-6 py-4 font-medium">{v.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{v.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{v.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[v.status]}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {v.status === "waiting" && (
                        <button onClick={() => handleVisitorStatus(v._id, "being_seen")} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200">Being Seen</button>
                      )}
                      {v.status === "being_seen" && (
                        <button onClick={() => handleVisitorStatus(v._id, "done")} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200">Done</button>
                      )}
                      {v.status === "done" && (
                        <button onClick={() => setShowVisitorProfile(v)} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200 cursor-pointer">View History</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Visitor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Register Walk-in Visitor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Full Name", name: "fullName", type: "text" },
                { label: "Phone", name: "phone", type: "text" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type={field.type} value={formData[field.name]} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Register</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visitor Profile Modal */}
      {showVisitorProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Visitor Profile</h2>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Full Name:</span> {showVisitorProfile.fullName}</p>
              <p><span className="font-medium">Phone:</span> {showVisitorProfile.phone}</p>
              <p><span className="font-medium">Gender:</span> {showVisitorProfile.gender}</p>
              <p><span className="font-medium">Reason:</span> {showVisitorProfile.reason}</p>
              <p><span className="font-medium">Ticket:</span> {showVisitorProfile.ticketNumber}</p>
              <p><span className="font-medium">Status:</span>
                <span className="ml-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Done</span>
              </p>
              <p><span className="font-medium">Visit Date:</span> {new Date(showVisitorProfile.visitDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Visit Time:</span> {new Date(showVisitorProfile.visitDate).toLocaleTimeString()}</p>
            </div>
            <button onClick={() => setShowVisitorProfile(null)} className="mt-6 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== REPORT TAB ====================
// ==================== REPORT TAB ====================

function ReportTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("daily");

  const fetchReport = async (selectedPeriod) => {
    setLoading(true);
    try {
      const res = await API.get(`/reception/reports/${selectedPeriod}`);
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  // Helper function to safely get a count whether the backend returns a number or an array of objects
  const getCount = (val) => {
    if (Array.isArray(val)) return val.length;
    return val || 0;
  };

  const cards = report ? [
    { label: "Patients Registered", value: getCount(report.totalPatientsRegistered ?? report.totalPatientsRegisteredToday), color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Appointments", value: getCount(report.appointments ?? report.appointmentsToday), color: "text-green-600", bg: "bg-green-50" },
    { label: "No Shows", value: getCount(report.noShows), color: "text-red-600", bg: "bg-red-50" },
    { label: "Walk-in Visitors", value: getCount(report.walkInVisitors), color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Checked In", value: getCount(report.totalCheckedIn), color: "text-yellow-600", bg: "bg-yellow-50" },
  ] : [];

  return (
    <div>
      {/* Header - hidden when printing */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-lg font-semibold text-gray-700">
          {report?.period} Report — {report?.date}
        </h2>
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
        >
          🖨️ Print Report
        </button>
      </div>

      {/* Period Selector - hidden when printing */}
      <div className="flex gap-2 mb-6 no-print">
        {["daily", "weekly", "monthly", "yearly"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              period === p
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Print Area */}
      {loading ? (
        <div className="text-center text-gray-500">Loading report...</div>
      ) : (
        <div className="print-area">
          {/* Report Header - visible when printing */}
          <div className="hidden print:block mb-8 text-center border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-800">Hospital Management System</h1>
            <p className="text-gray-500 mt-1">Reception Department</p>
            <h2 className="text-xl font-semibold text-gray-700 mt-4">{report?.period} Report</h2>
            <p className="text-gray-500 text-sm mt-1">{report?.date}</p>
            <p className="text-gray-500 text-sm">Printed on: {new Date().toLocaleString()}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div key={card.label} className={`${card.bg} rounded-xl shadow p-6`}>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <h2 className={`text-3xl font-bold ${card.color} mt-1`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Footer - visible when printing */}
          <div className="hidden print:block mt-10 pt-6 border-t text-center text-sm text-gray-400">
            <p>Generated by HMS — Hospital Management System</p>
            <p>Receptionist: {JSON.parse(localStorage.getItem("user") || "{}")?.fullName}</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ==================== MAIN RECEPTION PAGE ====================
const tabs = ["Patients", "Appointments", "Queue", "Visitors", "Report"];

function Reception() {
  const [activeTab, setActiveTab] = useState("Patients");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reception</h1>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === tab ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Patients" && <PatientsTab />}
      {activeTab === "Appointments" && <AppointmentsTab />}
      {activeTab === "Queue" && <QueueTab />}
      {activeTab === "Visitors" && <VisitorsTab />}
      {activeTab === "Report" && <ReportTab />}
    </div>
  );
}

export default Reception;



