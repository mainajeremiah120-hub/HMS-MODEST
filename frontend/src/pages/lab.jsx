import { useState, useEffect } from "react";
import API from "../api/axios";

// ==================== PENDING TAB ====================
function PendingTab({ onProcess, onDelete, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ FIX: Define user at the component level - safely get from localStorage
  const getUserRole = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      const parsed = JSON.parse(userData);
      return parsed?.role || null;
    } catch (e) {
      console.error("Error parsing user:", e);
      return null;
    }
  };
  
  const userRole = getUserRole();
  const canDelete = userRole === 'admin' || userRole === 'lab';

  const fetchRequests = async () => {
    try {
      const res = await API.get("/lab/requests?status=pending");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRequests(); 
  }, [refreshKey]);

  const urgencyColors = {
    routine: "bg-green-100 text-green-700",
    urgent: "bg-yellow-100 text-yellow-700",
    emergency: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Pending Lab Requests</h2>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No pending requests</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Test</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Urgency</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
                {canDelete && <th className="px-6 py-3 text-left">Delete</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{r.patient?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testType}</td>
                  <td className="px-6 py-4 text-gray-600">{r.doctor?.fullName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${urgencyColors[r.urgency]}`}>
                      {r.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onProcess(r)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition"
                    >
                      Process
                    </button>
                  </td>
                  {/* ✅ SAFELY access user role */}
                  {canDelete && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onDelete(r._id, r.patient?.fullName)}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 hover:text-white transition"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}   
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==================== PROCESSING TAB ====================
function ProcessingTab({ onEnterResults, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/lab/requests?status=processing");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [refreshKey]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Processing Lab Requests</h2>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No requests being processed</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Test</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{r.patient?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testType}</td>
                  <td className="px-6 py-4 text-gray-600">{r.doctor?.fullName}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onEnterResults(r)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 transition"
                    >
                      Enter Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==================== COMPLETED TAB ====================
function CompletedTab({ onViewReport, onDelete, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ FIX: Define user at the component level - safely get from localStorage
  const getUserRole = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      const parsed = JSON.parse(userData);
      return parsed?.role || null;
    } catch (e) {
      console.error("Error parsing user:", e);
      return null;
    }
  };
  
  const userRole = getUserRole();
  const canDelete = userRole === 'admin' || userRole === 'lab';

  const fetchRequests = async () => {
    try {
      const res = await API.get("/lab/requests/completed");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRequests(); 
  }, [refreshKey]); 

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Completed Lab Results</h2>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No completed results</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Test</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Resulted</th>
                <th className="px-6 py-3 text-left">Actions</th>
                {canDelete && (
                  <th className="px-6 py-3 text-left">Delete</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{r.patient?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testType}</td>
                  <td className="px-6 py-4 text-gray-600">{r.doctor?.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {r.resultUploadedAt ? new Date(r.resultUploadedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewReport(r)}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-purple-700 transition"
                    >
                      View Report
                    </button>
                  </td>
                  {/* ✅ SAFELY access user role */}
                  {canDelete && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onDelete(r._id, r.patient?.fullName)}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 hover:text-white transition"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==================== PATIENT HISTORY TAB ====================
function PatientHistoryTab({ onViewReport }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPatients = async () => {
    try {
      const res = await API.get(`/reception/patients?search=${search}`);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (patientId) => {
    setLoading(true);
    try {
      const res = await API.get(`/lab/patients/${patientId}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearch(patient.fullName);
    fetchHistory(patient._id);
  };

  const statusColors = {
    pending: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Patient Lab History</h2>
      <div className="flex gap-3 mb-6 relative">
        <input
          type="text"
          placeholder="Search patient by name or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); if (e.target.value.length > 2) searchPatients(); }}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={searchPatients} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Search</button>

        {patients.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {patients.map((p) => (
              <div key={p._id} onClick={() => handleSelectPatient(p)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                <p className="font-medium text-gray-800">{p.fullName}</p>
                <p className="text-xs text-gray-500">{p.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="font-medium text-blue-800">{selectedPatient.fullName}</p>
          <p className="text-sm text-blue-600">{selectedPatient.phone} · {selectedPatient.gender} · {selectedPatient.bloodGroup}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading history...</div>
      ) : history.length > 0 ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Test</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Doctor</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{r.testName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.testType}</td>
                  <td className="px-6 py-4 text-gray-600">{r.doctor?.fullName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4">
                    {r.status === "completed" && (
                      <button onClick={() => onViewReport(r)} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-purple-700 transition">
                        View Report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedPatient ? (
        <div className="text-center text-gray-500">No lab history found for this patient</div>
      ) : null}
    </div>
  );
}

// ==================== RESULT ENTRY MODAL ====================
function ResultEntryModal({ request, onClose, onSave }) {
  const [template, setTemplate] = useState([]);
  const [results, setResults] = useState([]);
  const [interpretation, setInterpretation] = useState("");
  const [labNotes, setLabNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await API.get(`/lab/template/${encodeURIComponent(request.testType)}`);
        const tmpl = res.data.template;
        setTemplate(tmpl);
        setResults(tmpl.map((t) => ({
          parameter: t.parameter,
          loincCode: t.loincCode,
          value: "",
          unit: t.unit,
          referenceRange: t.referenceRange,
          flag: "NORMAL",
        })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplate();
  }, [request]);

  const handleValueChange = (index, value) => {
    const updated = [...results];
    updated[index].value = value;
    updated[index].flag = calculateFlag(value, updated[index].referenceRange);
    setResults(updated);
  };

  const handleFlagChange = (index, flag) => {
    const updated = [...results];
    updated[index].flag = flag;
    setResults(updated);
  };

  const calculateFlag = (value, referenceRange) => {
    if (!value || !referenceRange) return "NORMAL";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "NORMAL";
    const rangeMatch = referenceRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
    if (!rangeMatch) return "NORMAL";
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (numValue < min * 0.8) return "CRITICAL LOW";
    if (numValue < min) return "LOW";
    if (numValue > max * 1.2) return "CRITICAL HIGH";
    if (numValue > max) return "HIGH";
    return "NORMAL";
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await API.put(`/lab/requests/${request._id}/result`, {
        results,
        interpretation,
        labNotes,
      });
      onSave();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save results");
    } finally {
      setLoading(false);
    }
  };

  const flagColors = {
    "NORMAL": "text-green-600",
    "LOW": "text-yellow-600",
    "HIGH": "text-orange-600",
    "CRITICAL LOW": "text-red-700 font-bold",
    "CRITICAL HIGH": "text-red-700 font-bold",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Enter Lab Results</h2>
          <p className="text-sm text-gray-500 mt-1">
            {request.testName} — {request.patient?.fullName} — Dr. {request.doctor?.fullName}
          </p>
        </div>

        <div className="p-6">
          <table className="w-full text-sm mb-6">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Parameter</th>
                <th className="px-4 py-3 text-left">LOINC</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Reference Range</th>
                <th className="px-4 py-3 text-left">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.parameter}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.loincCode || "—"}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={r.value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder="Enter value"
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.unit || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.referenceRange || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.flag}
                      onChange={(e) => handleFlagChange(index, e.target.value)}
                      className={`text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none ${flagColors[r.flag]}`}
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="LOW">LOW</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL LOW">CRITICAL LOW</option>
                      <option value="CRITICAL HIGH">CRITICAL HIGH</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Interpretation</label>
            <textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              rows={3}
              placeholder="Overall interpretation of results..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Notes</label>
            <textarea
              value={labNotes}
              onChange={(e) => setLabNotes(e.target.value)}
              rows={2}
              placeholder="Additional notes..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Results"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== LAB REPORT MODAL ====================
function LabReportModal({ request, onClose }) {
  const getUser = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return {};
      return JSON.parse(userData);
    } catch (e) {
      console.error("Error parsing user:", e);
      return {};
    }
  };
  
  const user = getUser();

  const flagColors = {
    "NORMAL": "text-green-700",
    "LOW": "text-yellow-600",
    "HIGH": "text-orange-600",
    "CRITICAL LOW": "text-red-700 font-bold",
    "CRITICAL HIGH": "text-red-700 font-bold",
  };

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b no-print">
          <h2 className="text-lg font-bold text-gray-800">Lab Report</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
              🖨️ Print Report
            </button>
            <button onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition">
              Close
            </button>
          </div>
        </div>

        <div className="print-area p-8">
          <div className="text-center border-b pb-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Hospital Management System</h1>
            <p className="text-gray-500">Laboratory Department</p>
            <h2 className="text-lg font-semibold text-blue-700 mt-2">Laboratory Report</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Patient Information</h3>
              <p className="text-sm"><span className="font-medium">Name:</span> {request.patient?.fullName}</p>
              <p className="text-sm"><span className="font-medium">Gender:</span> {request.patient?.gender}</p>
              <p className="text-sm"><span className="font-medium">Blood Group:</span> {request.patient?.bloodGroup || "—"}</p>
              <p className="text-sm"><span className="font-medium">Phone:</span> {request.patient?.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Test Information</h3>
              <p className="text-sm"><span className="font-medium">Test:</span> {request.testName}</p>
              <p className="text-sm"><span className="font-medium">Type:</span> {request.testType}</p>
              <p className="text-sm"><span className="font-medium">Requesting Doctor:</span> {request.doctor?.fullName}</p>
              <p className="text-sm"><span className="font-medium">Date Requested:</span> {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "—"}</p>
              <p className="text-sm"><span className="font-medium">Date Resulted:</span> {request.resultUploadedAt ? new Date(request.resultUploadedAt).toLocaleDateString() : "—"}</p>
              <p className="text-sm"><span className="font-medium">Processed By:</span> {request.processedBy?.fullName || user?.fullName}</p>
            </div>
          </div>

          {request.clinicalNotes && (
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">Clinical Notes from Doctor:</p>
              <p className="text-sm text-gray-600">{request.clinicalNotes}</p>
            </div>
          )}

          {request.results && request.results.length > 0 ? (
            <table className="w-full text-sm mb-6 border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left border border-gray-200">Parameter</th>
                  <th className="px-4 py-2 text-left border border-gray-200">Value</th>
                  <th className="px-4 py-2 text-left border border-gray-200">Unit</th>
                  <th className="px-4 py-2 text-left border border-gray-200">Reference Range</th>
                  <th className="px-4 py-2 text-left border border-gray-200">Flag</th>
                </tr>
              </thead>
              <tbody>
                {request.results.map((r, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 border border-gray-200 font-medium">{r.parameter}</td>
                    <td className="px-4 py-2 border border-gray-200">{r.value || "—"}</td>
                    <td className="px-4 py-2 border border-gray-200">{r.unit || "—"}</td>
                    <td className="px-4 py-2 border border-gray-200">{r.referenceRange || "—"}</td>
                    <td className={`px-4 py-2 border border-gray-200 ${flagColors[r.flag]}`}>{r.flag || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center text-yellow-700 text-sm">
              ⚠️ No results entered for this test — this was processed with the old system.
            </div>
          )}

          {request.interpretation && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-1">Interpretation</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{request.interpretation}</p>
            </div>
          )}

          {request.labNotes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-1">Lab Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{request.labNotes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">Lab Technician Signature:</p>
              <div className="border-b border-gray-400 mt-8 mb-1"></div>
              <p className="text-xs text-gray-500">{request.processedBy?.fullName || user?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Stamp:</p>
              <div className="border-b border-gray-400 mt-8 mb-1"></div>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="text-center mt-6 pt-4 border-t text-xs text-gray-400">
            <p>Generated by HMS — Hospital Management System</p>
            <p>Printed on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN LAB PAGE ====================
const tabs = [
  { id: "pending", label: "⏳ Pending" },
  { id: "processing", label: "🔬 Processing" },
  { id: "completed", label: "✅ Completed" },
  { id: "history", label: "📋 Patient History" },
];

function Lab() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProcess = async (request) => {
    try {
      await API.put(`/lab/requests/${request._id}/process`);
      setRefreshKey((k) => k + 1);
      setActiveTab("processing");
    } catch (err) {
      alert("Failed to process request");
    }
  };

  const handleEnterResults = (request) => {
    setSelectedRequest(request);
    setShowResultModal(true);
  };

  const handleViewReport = async (request) => {
    try {
      const res = await API.get(`/lab/requests/${request._id}`);
      setSelectedRequest(res.data.labRequest); 
      setShowReportModal(true);
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("Could not load results. Check backend console.");
    }
  };

  const handleDeleteLabRequest = async (id, patientName) => {
    if (window.confirm(`Are you sure you want to permanently delete the lab request for ${patientName || "this patient"}?`)) {
      try {
        await API.delete(`/lab/requests/${id}`);
        alert("Lab record successfully deleted.");
        setRefreshKey((k) => k + 1); 
      } catch (err) {
        console.error(err);
        alert("Deletion failed: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSave = () => {
    setRefreshKey((k) => k + 1);
    setActiveTab("completed");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Laboratory</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pending" && (
        <PendingTab 
          refreshKey={refreshKey}
          onProcess={handleProcess} 
          onDelete={handleDeleteLabRequest} 
        />
      )}
      {activeTab === "processing" && (
        <ProcessingTab 
          refreshKey={refreshKey}
          onEnterResults={handleEnterResults} 
        />
      )}
      {activeTab === "completed" && (
        <CompletedTab 
          refreshKey={refreshKey}
          onViewReport={handleViewReport} 
          onDelete={handleDeleteLabRequest} 
        />
      )}
      {activeTab === "history" && (
        <PatientHistoryTab 
          onViewReport={handleViewReport} 
        />
      )}

      {/* Result Entry Modal */}
      {showResultModal && selectedRequest && (
        <ResultEntryModal
          request={selectedRequest}
          onClose={() => setShowResultModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Lab Report Modal */}
      {showReportModal && selectedRequest && (
        <LabReportModal
          request={selectedRequest}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export default Lab;