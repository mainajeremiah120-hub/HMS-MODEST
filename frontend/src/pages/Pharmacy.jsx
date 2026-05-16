import { useState, useEffect } from "react";
import API from "../api/axios";

// ==================== PRESCRIPTION PROCESSING TAB ====================
// Matches pharmacy.controller.js -> getPrescriptions
function PrescriptionQueueTab() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      // Endpoint logic: Fetch only 'pending' or 'prepared' statuses
      const res = await API.get("/pharmacy/prescriptions?status=pending");
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Queue fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDispense = async (prescriptionId) => {
    try {
      // Matches pharmacy.route.js POST /dispense
      await API.post("/pharmacy/dispense", { 
        prescriptionId,
        dispensedBy: "Current_User_ID" // Replace with auth context
      });
      alert("Dispensed successfully! Inventory updated via FEFO.");
      fetchQueue();
    } catch (err) {
      alert("Dispensing failed: " + err.response?.data?.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Prescription Queue</h2>
        <button onClick={fetchQueue} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Refresh</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading orders...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No pending prescriptions</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Medications</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prescriptions.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{p.patient?.fullName}</td>
                  <td className="px-6 py-4">
                    {p.medications.map(m => `${m.drugName} (${m.dosage})`).join(", ")}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDispense(p._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                    >
                      Dispense
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
function InventoryTab({ userRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventory, setInventory] = useState([]); // Array to hold your drugs
  const [formData, setFormData] = useState({
    itemName: "",
    batchNumber: "",
    stock: "",
    expiryDate: "",
    status: "Active"
  });

  // Check permissions
  const canAddDrug = userRole === "admin" || userRole === "pharmacist";

  const handleAddDrug = async (e) => {
    e.preventDefault();
    try {
      await API.post("/pharmacy/inventory/add", formData);
      alert("New batch added successfully!");
      setIsModalOpen(false);
      // fetchInventory(); // Call your function to reload the list
    } catch (err) {
      alert("Error: " + err.response?.data?.message);
    }
  };

  return (
    <div className="p-4">
      {/* HEADER SECTION: Title + Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Drug Inventory (FEFO Tracking)</h2>
        
        {canAddDrug && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
          >
            <span className="font-bold">+</span> Add New Stock
          </button>
        )}
      </div>

      {/* RESTORED TABLE STRUCTURE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Drug Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch No</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* If inventory is empty, show a message */}
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                  No drugs found in inventory. Click "Add New Stock" to begin.
                </td>
              </tr>
            ) : (
              inventory.map((drug, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{drug.itemName}</td>
                  <td className="px-6 py-4 text-gray-600">{drug.batchNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{drug.stock}</td>
                  <td className="px-6 py-4 text-gray-600">{drug.expiryDate}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      {drug.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD DRUG MODAL (Standard UI) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Inventory Batch</h3>
            <form onSubmit={handleAddDrug} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Paracetamol" 
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <input 
                    type="text" 
                    placeholder="B-102" 
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    placeholder="500" 
                    required
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


 

// ==================== MAIN PHARMACY COMPONENT ====================
export default function Pharmacy() {
  const [activeTab, setActiveTab] = useState("queue");

  const tabs = [
    { id: "queue", label: "Prescription Queue", icon: "📋" },
    { id: "inventory", label: "Inventory / FEFO", icon: "💊" },
    { id: "dispensed", label: "Dispensing History", icon: "🕒" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Pharmacy Department</h1>
        
        {/* Tab Navigation (Matching Clinical.jsx Style) */}
        <div className="flex space-x-1 mb-8 bg-gray-200 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === "queue" && <PrescriptionQueueTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "dispensed" && <div className="p-10 text-center text-gray-500">History Module Under Construction</div>}
        </div>
      </div>
    </div>
  );
}