import { useState, useEffect } from "react";
import API from "../api/axios";

// ==================== APPOINTMENTS TAB ====================
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);

  const fetchAppointments = async () => {
    try {
      const endpoint = viewAll ? "/clinical/appointments/all" : "/clinical/appointments";
      const res = await API.get(endpoint);
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [viewAll]);

  const handleApprove = async (id) => {
    try {
      await API.put(`/appointments/${id}/approve`);
      fetchAppointments();
    } catch (err) {
      console.error("Approval failed", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/appointments/${id}/reject`);
      fetchAppointments();
    } catch (err) {
      console.error("Rejection failed", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await API.delete(`/appointments/${id}`);
      fetchAppointments();
    } catch (err) {
      console.error("Deletion failed", err);
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
        <h2 className="text-lg font-semibold text-gray-700">
          {viewAll ? "All Appointments" : "Today's Appointments"}
        </h2>
        <button
          onClick={() => setViewAll(!viewAll)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          {viewAll ? "Today Only" : "View All"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No appointments found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3 text-left">Patient</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Reason</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">{a.patient?.fullName || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(a.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{a.appointmentTime}</td>
                  <td className="px-6 py-4 text-gray-600">{a.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {a.status === "scheduled" && (
                        <>
                          <button
                            onClick={() => handleApprove(a._id)}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-semibold hover:bg-green-200 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(a._id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-semibold hover:bg-red-200 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-200 transition"
                      >
                        Delete
                      </button>
                    </div>
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

// ==================== CONSULTATION TAB ====================
function ConsultationTab() {
  const [patientList, setPatientList] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patient: "",
    symptoms: "",
    diagnosis: "",
    icd10Code: "",
    icd10Description: "",
    notes: "",
    followUpDate: "",
    consultationFee: 500,
    vitals: {
      bloodPressure: "",
      temperature: "",
      pulse: "",
      weight: "",
      height: "",
      oxygenSaturation: "",
      respiratoryRate: "",
    },
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await API.get("/patients");
      setPatientList(res.data);
    };
    fetchPatients();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVitalChange = (e) => {
    setFormData({
      ...formData,
      vitals: { ...formData.vitals, [e.target.name]: e.target.value },
    });
  };

  const handleAISuggest = async () => {
    if (!formData.symptoms) {
      alert("Please enter symptoms first!");
      return;
    }
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const selectedPatient = patientList.find((p) => p._id === formData.patient);
      const res = await API.post("/clinical/ai/suggest-diagnosis", {
        symptoms: formData.symptoms,
        patientAge: selectedPatient?.dateOfBirth
          ? new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()
          : null,
        patientGender: selectedPatient?.gender,
        vitals: formData.vitals,
      });
      setAiSuggestion(res.data);
    } catch (err) {
      alert("AI suggestion failed: " + err.response?.data?.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyDiagnosis = (diagnosis) => {
    setFormData({
      ...formData,
      diagnosis: diagnosis.diagnosis,
      icd10Code: diagnosis.icd10Code,
      icd10Description: diagnosis.icd10Description,
    });
    setAiSuggestion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/clinical/consultations", formData);
      setSuccess("Consultation created successfully!");
      setFormData({
        patient: "", symptoms: "", diagnosis: "", icd10Code: "",
        icd10Description: "", notes: "", followUpDate: "",consultationFee: 500,
        vitals: { bloodPressure: "", temperature: "", pulse: "", weight: "", height: "", oxygenSaturation: "", respiratoryRate: "" },
      });
      setAiSuggestion(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create consultation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">New Consultation</h2>
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Patient</h3>
          <select name="patient" value={formData.patient} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select patient</option>
            {patientList.map((p) => (
              <option key={p._id} value={p._id}>{p.fullName} — {p.phone}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Vitals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Blood Pressure", name: "bloodPressure", placeholder: "120/80" },
              { label: "Temperature (°C)", name: "temperature", placeholder: "37.0" },
              { label: "Pulse (bpm)", name: "pulse", placeholder: "72" },
              { label: "Weight (kg)", name: "weight", placeholder: "70" },
              { label: "Height (cm)", name: "height", placeholder: "170" },
              { label: "O2 Saturation (%)", name: "oxygenSaturation", placeholder: "98" },
              { label: "Respiratory Rate", name: "respiratoryRate", placeholder: "16" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input type="text" name={field.name} value={formData.vitals[field.name]} onChange={handleVitalChange} placeholder={field.placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Symptoms & Diagnosis</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
            <textarea name="symptoms" value={formData.symptoms} onChange={handleChange} required rows={3} placeholder="Describe patient symptoms..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button type="button" onClick={handleAISuggest} disabled={aiLoading} className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm disabled:opacity-50">
              {aiLoading ? "AI Thinking..." : "🤖 AI Suggest Diagnosis"}
            </button>
          </div>

          {aiSuggestion && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-purple-700 mb-3">🤖 AI Diagnosis Suggestions</h4>
              <div className="space-y-3">
                {aiSuggestion.diagnoses?.map((d) => (
                  <div key={d.rank} className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{d.rank}. {d.diagnosis}</p>
                        <p className="text-xs text-gray-500">ICD-10: {d.icd10Code} — {d.icd10Description}</p>
                        <p className="text-xs text-gray-600 mt-1">{d.reasoning}</p>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${d.confidence === "high" ? "bg-green-100 text-green-700" : d.confidence === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{d.confidence} confidence</span>
                      </div>
                      <button type="button" onClick={() => applyDiagnosis(d)} className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700">Apply</button>
                    </div>
                  </div>
                ))}
              </div>
              {aiSuggestion.recommendedInvestigations?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-purple-700">Recommended Investigations:</p>
                  <p className="text-xs text-gray-600">{aiSuggestion.recommendedInvestigations.join(", ")}</p>
                </div>
              )}
              <p className={`text-xs mt-2 font-medium ${aiSuggestion.urgencyLevel === "emergency" ? "text-red-600" : aiSuggestion.urgencyLevel === "urgent" ? "text-orange-600" : "text-green-600"}`}>Urgency: {aiSuggestion.urgencyLevel}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <input type="text" name="diagnosis" value={formData.diagnosis} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
              <input type="text" name="icd10Code" value={formData.icd10Code} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Description</label>
              <input type="text" name="icd10Description" value={formData.icd10Description} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Additional notes..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        {/* ==================== NEW CONSULTATION FEE SECTION ==================== */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            💵 Consultation Billing Charges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Category</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                onChange={(e) => {
                  let fee = 500;
                  if (e.target.value === "specialist") fee = 1000;
                  if (e.target.value === "exempt") fee = 0;
                  setFormData({ ...formData, consultationFee: fee });
                }}
              >
                <option value="standard">Standard Consultation (KSh 500)</option>
                <option value="specialist">Specialist Consultation (KSh 1,000)</option>
                <option value="exempt">Exempt / Corporate Scheme (KSh 0)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (KSh)</label>
              <input 
                type="number" 
                name="consultationFee" 
                value={formData.consultationFee} 
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-gray-800" 
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            * Saving this consultation will automatically queue this balance into the cashier desk's pending bills pool.
          </p>
        </div>
        {/* ====================================================================== */}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Saving..." : "Save Consultation"}
        </button>
      </form>
    </div>
  );
}

// ==================== PRESCRIPTIONS TAB ====================
function PrescriptionsTab() {
  const [patientList, setPatientList] = useState([]);
  const [interactionResult, setInteractionResult] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patient: "",
    medications: [{ drugName: "", dosage: "", frequency: "", duration: "", instructions: "" }],
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await API.get("/patients");
      setPatientList(res.data);
    };
    fetchPatients();
  }, []);

  const handleMedChange = (index, e) => {
    const meds = [...formData.medications];
    meds[index][e.target.name] = e.target.value;
    setFormData({ ...formData, medications: meds });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { drugName: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    });
  };

  const removeMedication = (index) => {
    const meds = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: meds });
  };

  const handleCheckInteraction = async () => {
    if (formData.medications.length < 2) {
      alert("Add at least 2 medications to check interactions!");
      return;
    }
    setInteractionLoading(true);
    try {
      const res = await API.post("/clinical/prescriptions/check-interaction", {
        medications: formData.medications,
      });
      setInteractionResult(res.data);
    } catch (err) {
      alert("Interaction check failed");
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/clinical/prescriptions", formData);
      setSuccess("Prescription created successfully!");
      setFormData({
        patient: "",
        medications: [{ drugName: "", dosage: "", frequency: "", duration: "", instructions: "" }],
      });
      setInteractionResult(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Write Prescription</h2>
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
          <select value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select patient</option>
            {patientList.map((p) => (<option key={p._id} value={p._id}>{p.fullName} — {p.phone}</option>))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Medications</h3>
            <button type="button" onClick={addMedication} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">+ Add Drug</button>
          </div>
          {formData.medications.map((med, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-700 text-sm">Drug {index + 1}</span>
                {formData.medications.length > 1 && (
                  <button type="button" onClick={() => removeMedication(index)} className="text-red-500 text-xs hover:underline">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Drug Name", name: "drugName", placeholder: "e.g. Paracetamol" },
                  { label: "Dosage", name: "dosage", placeholder: "e.g. 500mg" },
                  { label: "Frequency", name: "frequency", placeholder: "e.g. 3 times daily" },
                  { label: "Duration", name: "duration", placeholder: "e.g. 5 days" },
                  { label: "Instructions", name: "instructions", placeholder: "e.g. After meals" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                    <input type="text" name={field.name} value={med[field.name]} onChange={(e) => handleMedChange(index, e)} placeholder={field.placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={handleCheckInteraction} disabled={interactionLoading} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition disabled:opacity-50">
            {interactionLoading ? "Checking..." : "⚠️ Check Drug Interactions"}
          </button>
          {interactionResult && (
            <div className={`mt-4 rounded-xl p-4 ${interactionResult.hasInteractions ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              <h4 className={`font-semibold mb-2 ${interactionResult.hasInteractions ? "text-red-700" : "text-green-700"}`}>
                {interactionResult.hasInteractions ? "⚠️ Drug Interactions Found!" : "✅ No Interactions Found"}
              </h4>
              <p className="text-sm text-gray-700">{interactionResult.summary}</p>
              {interactionResult.interactions?.map((interaction, i) => (
                <div key={i} className="mt-2 bg-white rounded-lg p-3 text-sm">
                  <p className="font-medium">{interaction.drugs?.join(" + ")}</p>
                  <p className="text-red-600">Severity: {interaction.severity}</p>
                  <p className="text-gray-600">{interaction.effect}</p>
                  <p className="text-blue-600">Management: {interaction.management}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Saving..." : "Save Prescription"}
        </button>
      </form>
    </div>
  );
}

// ==================== LAB REQUESTS TAB ====================
function LabTab() {
  const [patientList, setPatientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patient: "", testName: "", testType: "", urgency: "routine", clinicalNotes: "",
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await API.get("/patients");
      setPatientList(res.data);
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/clinical/lab-requests", formData);
      setSuccess("Lab request sent successfully!");
      setFormData({ patient: "", testName: "", testType: "", urgency: "routine", clinicalNotes: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lab request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Request Lab Test</h2>
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
          <select value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select patient</option>
            {patientList.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
          <input type="text" value={formData.testName} onChange={(e) => setFormData({ ...formData, testName: e.target.value })} required placeholder="e.g. Malaria RDT" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
          <select value={formData.testType} onChange={(e) => setFormData({ ...formData, testType: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select test type</option>
            {["Blood Test", "Urine Test", "Stool Test", "Culture & Sensitivity", "HIV Test", "Malaria Test", "Liver Function Test", "Kidney Function Test", "Full Blood Count", "Blood Sugar", "Lipid Profile", "Thyroid Function", "Other"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
          <select value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
          <textarea value={formData.clinicalNotes} onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })} rows={3} placeholder="Additional notes for lab..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Sending..." : "Send Lab Request"}
        </button>
      </form>
    </div>
  );
}

// ==================== RADIOLOGY TAB ====================
function RadiologyTab() {
  const [patientList, setPatientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patient: "", scanType: "", bodyPart: "", urgency: "routine", clinicalNotes: "",
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await API.get("/patients");
      setPatientList(res.data);
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/clinical/radiology-requests", formData);
      setSuccess("Radiology request sent successfully!");
      setFormData({ patient: "", scanType: "", bodyPart: "", urgency: "routine", clinicalNotes: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create radiology request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Request Radiology Scan</h2>
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
          <select value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select patient</option>
            {patientList.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
          <select value={formData.scanType} onChange={(e) => setFormData({ ...formData, scanType: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select scan type</option>
            {["X-Ray", "Ultrasound", "CT Scan", "MRI", "Mammogram", "Fluoroscopy", "PET Scan", "DEXA Scan", "Other"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
          <input type="text" value={formData.bodyPart} onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })} required placeholder="e.g. Chest, Abdomen" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
          <select value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
          <textarea value={formData.clinicalNotes} onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })} rows={3} placeholder="Additional notes for radiology..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Sending..." : "Send Radiology Request"}
        </button>
      </form>
    </div>
  );
}

// ==================== WARD TAB ====================
function WardTab() {
  const [patientList, setPatientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    patient: "", wardType: "", admissionReason: "", urgency: "routine",
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await API.get("/patients");
      setPatientList(res.data);
    };
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await API.post("/clinical/ward-requests", formData);
      setSuccess("Ward admission request sent successfully!");
      setFormData({ patient: "", wardType: "", admissionReason: "", urgency: "routine" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ward request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Request Ward Admission</h2>
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
          <select value={formData.patient} onChange={(e) => setFormData({ ...formData, patient: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select patient</option>
            {patientList.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ward Type</label>
          <select value={formData.wardType} onChange={(e) => setFormData({ ...formData, wardType: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select ward</option>
            {["General Ward", "ICU", "Maternity", "Pediatric", "Surgical", "Isolation", "Emergency", "Other"].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Reason</label>
          <textarea value={formData.admissionReason} onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })} required rows={3} placeholder="Reason for admission..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
          <select value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Sending..." : "Send Ward Request"}
        </button>
      </form>
    </div>
  );
}

// ==================== MAIN CLINICAL PAGE ====================
const tabs = [
  { id: "appointments", label: "📅 Appointments" },
  { id: "consultation", label: "🩺 Consultation" },
  { id: "prescriptions", label: "💊 Prescriptions" },
  { id: "lab", label: "🧪 Lab" },
  { id: "radiology", label: "🔬 Radiology" },
  { id: "ward", label: "🛏️ Ward" },
];

function Clinical() {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Clinical Consultation</h1>
      <div className="flex gap-2 mb-6 border-b border-gray-200 flex-wrap">
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
      {activeTab === "appointments" && <AppointmentsTab />}
      {activeTab === "consultation" && <ConsultationTab />}
      {activeTab === "prescriptions" && <PrescriptionsTab />}
      {activeTab === "lab" && <LabTab />}
      {activeTab === "radiology" && <RadiologyTab />}
      {activeTab === "ward" && <WardTab />}
    </div>
  );
}

export default Clinical;