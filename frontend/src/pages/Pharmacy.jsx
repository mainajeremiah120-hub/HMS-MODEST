import { useState, useEffect } from "react";
import API from "../api/axios"; 

// ==================== 🕒 DISPENSING HISTORY TAB ====================
function DispensingHistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // Hits router.get('/requests/completed')
      const res = await API.get("/pharmacy/requests/completed");
      
      // Safety guards to handle raw arrays or normalized { success: true, data: [...] } wrapper payloads
      if (res.data && Array.isArray(res.data.data)) {
        setHistory(res.data.data);
      } else if (res.data && Array.isArray(res.data)) {
        setHistory(res.data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to load dispense history logs:", err);
      setError(err.response?.data?.message || "Could not load the logging logs history profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="font-semibold">{error}</p>
        <button onClick={fetchHistory} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
          Retry Reload
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Completed Dispensation Logs (FEFO Audits)</h2>
        <button onClick={fetchHistory} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          Refresh Logs
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading completed history...</div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-medium">
            No medication orders have been dispensed yet today.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3">Patient Name</th>
                <th className="px-6 py-3">Medications Issued</th>
                <th className="px-6 py-3">Dispensed At</th>
                <th className="px-6 py-3">Payment Lifecycle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((log) => (
                <tr key={log?._id || Math.random()} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {log?.patient?.fullName || "Walk-in Patient"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {Array.isArray(log?.medications)
                      ? log.medications.map(m => `${m?.drugName || m?.medicine || "Item"} x${m?.quantity || 1}`).join(", ")
                      : "No drugs tracked"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {log?.dispensedAt ? new Date(log.dispensedAt).toLocaleString() : "Recently"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 capitalize">
                      {log?.paymentStatus || "completed"}
                    </span>
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

// ==================== 📋 PRESCRIPTION QUEUE TAB ====================
function PrescriptionQueueTab() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/pharmacy/requests?status=pending");
      
      if (res.data && Array.isArray(res.data)) {
        setPrescriptions(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setPrescriptions(res.data.data);
      } else {
        setPrescriptions([]);
      }
    } catch (err) {
      console.error("Queue fetch failed", err);
      setError(err.response?.data?.message || "Failed to load prescription queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDispense = async (prescriptionId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const userId = currentUser?._id || currentUser?.id; 

      if (!userId) {
        alert("Error: You must be logged in to dispense medications.");
        return;
      }

      await API.put(`/pharmacy/requests/${prescriptionId}/dispense`, { 
        dispensedBy: userId 
      });

      alert("Dispensed successfully! Inventory updated via FEFO strategy.");
      fetchQueue(); 
    } catch (err) {
      console.error("Dispensing backend error payload:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown server error";
      alert("Dispensing failed: " + errorMsg);
    }
  };

  // ✅ NEW: Handles direct removal from queue
  const handleCancelRequest = async (prescriptionId, patientName) => {
    if (window.confirm(`Are you sure you want to completely remove the prescription for ${patientName}?`)) {
      try {
        await API.delete(`/pharmacy/requests/${prescriptionId}`);
        alert("Prescription order removed successfully.");
        fetchQueue(); // Reload queue matching current db records
      } catch (err) {
        console.error("Failed to delete request:", err);
        alert("Delete failed: " + (err.response?.data?.message || err.message));
      }
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="font-semibold">{error}</p>
        <button onClick={fetchQueue} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
          Try Again
        </button>
      </div>
    );
  }

  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Prescription Queue</h2>
        <button onClick={fetchQueue} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          Refresh Queue
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading active orders...</div>
        ) : safePrescriptions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No pending prescriptions found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Medications</th>
                <th className="px-6 py-3">Date Issued</th>
                <th className="px-6 py-3 text-center">Action Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safePrescriptions.map((p) => {
                const patientName = p?.patient?.fullName || "Walk-in Patient";
                return (
                  <tr key={p?._id || Math.random()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{patientName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {Array.isArray(p?.medications) 
                        ? p.medications.map(m => `${m?.drugName || m?.medicine || "Unknown Medicine"} (${m?.dosage || "N/A"}) x${m?.quantity || 1}`).join(", ")
                        : "No medications listed"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Today"}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleDispense(p?._id)}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                      >
                        Dispense
                      </button>
                      
                      {/* ✅ NEW: Cancel / Delete Queue Button */}
                      <button 
                        onClick={() => handleCancelRequest(p?._id, patientName)}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600 hover:text-white transition"
                        title="Cancel Order"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==================== 💊 INVENTORY / FEFO MANAGEMENT TAB ====================
function InventoryTab({ userRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    itemName: "",
    itemType: "medicine", 
    batchNumber: "",
    quantity: "",
    sellingPrice: "",
    reorderLevel: "10",
    expiryDate: ""
  });

  const normalizedRole = userRole?.toLowerCase();
  const canAddDrug = normalizedRole === "admin" || normalizedRole === "pharmacist";

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await API.get("/pharmacy/inventory");
      setInventory(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddDrug = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        itemName: formData.itemName,
        itemType: formData.itemType || "medicine",
        sellingPrice: Number(formData.sellingPrice),
        reorderLevel: Number(formData.reorderLevel || 10),
        batches: [
          {
            batchNumber: formData.batchNumber,
            quantity: parseInt(formData.quantity, 10),
            expiryDate: formData.expiryDate,
            sellingPrice: Number(formData.sellingPrice),
          },
        ],
      };

      await API.post("/pharmacy/inventory", payload);
      alert("Stock batch added successfully!");
      setIsModalOpen(false);
      
      setFormData({
        itemName: "",
        itemType: "medicine",
        batchNumber: "",
        quantity: "",
        sellingPrice: "",
        reorderLevel: "10",
        expiryDate: ""
      });
      
      fetchInventory();
    } catch (err) {
      alert("Error saving stock: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (window.confirm(`Are you sure you want to permanently delete ${itemName} from stock records?`)) {
      try {
        await API.delete(`/pharmacy/inventory/${itemId}`);
        alert("Item deleted successfully!");
        fetchInventory(); 
      } catch (err) {
        alert("Delete failed: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Drug Inventory Catalog</h2>
        {canAddDrug && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
          >
            <span className="font-bold">+</span> Restock / New Batch
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading stock details...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3">Drug Name</th>
                <th className="px-6 py-3">Classification</th>
                <th className="px-6 py-3">Total Units Left</th>
                <th className="px-6 py-3">Unit Cost</th>
                <th className="px-6 py-3">Reorder Alert Mark</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                    No matching inventory profiles. Press "Restock / New Batch" to load data.
                  </td>
                </tr>
              ) : (
                inventory.map((drug) => (
                  <tr key={drug._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{drug.itemName}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{drug.itemType}</td>
                    <td className="px-6 py-4 font-bold text-gray-700">{drug.totalStock}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                        KES {drug.sellingPrice || drug.batches?.[0]?.sellingPrice || "0"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{drug.reorderLevel}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        drug.totalStock <= drug.reorderLevel
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {drug.totalStock <= drug.reorderLevel ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(drug._id, drug.itemName)}
                        className="text-red-600 hover:text-red-900 font-semibold transition text-xs px-3 py-1 rounded hover:bg-red-50"
                      >
                        Remove Completely
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD DRUG MODAL LAYOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Register Active Batch</h3>
            <form onSubmit={handleAddDrug} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drug / Medicine Name</label>
                <input type="text" required placeholder="e.g. Amoxicillin 500mg" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Category Type</label>
                <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.itemType} onChange={(e) => setFormData({...formData, itemType: e.target.value})}>
                  <option value="medicine">Medicine</option>
                  <option value="supply">Medical Supply</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <input type="text" required placeholder="e.g. BATCH-2026" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.batchNumber} onChange={(e) => setFormData({...formData, batchNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Units)</label>
                  <input type="number" required placeholder="100" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KES)</label>
                  <input type="number" required placeholder="120" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Minimum</label>
                  <input type="number" placeholder="10" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FEFO Expiration Expiry Date</label>
                <input type="date" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition">Discard</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Commit Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 🏢 WRAPPER ELEMENT DASHBOARD ====================
export default function Pharmacy() {
  const [activeTab, setActiveTab] = useState("queue");

  const tabs = [
    { id: "queue", label: "Prescription Queue Workspace", icon: "📋" },
    { id: "inventory", label: "Inventory / FEFO Dashboard", icon: "💊" },
    { id: "dispensed", label: "Dispensing History log", icon: "🕒" },
  ];

  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return "guest";
      const userObj = JSON.parse(userStr);
      return userObj?.role || "guest";
    } catch {
      return "guest";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Pharmacy Department Management Workspace</h1>
        
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

        <div className="transition duration-150 ease-in-out">
          {activeTab === "queue" && <PrescriptionQueueTab />}
          {activeTab === "inventory" && <InventoryTab userRole={getUserRole()} />}
          {activeTab === "dispensed" && <DispensingHistoryTab />}
        </div>
      </div>
    </div>
  );
}