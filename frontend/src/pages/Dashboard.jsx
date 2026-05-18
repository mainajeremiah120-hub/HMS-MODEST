import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();
  const [activeDeptTab, setActiveDeptTab] = useState("clinical");
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalPatients: 0,
    appointmentsToday: 0,
  });

  // Comprehensive tracking states across the facility
  const [pharmacyQueue, setPharmacyQueue] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [clinicalStats, setClinicalStats] = useState({ activeConsultations: 0, waitingCount: 0 });

  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      try {
        setLoading(true);
        
        // Execute simultaneous asynchronous operations across all department models
        const [
          staffRes, 
          patientsRes, 
          appointmentsRes, 
          pharmacyReqRes, 
          inventoryRes,
          labRes
        ] = await Promise.all([
          API.get("/staff").catch(() => ({ data: { staff: [] } })),
          API.get("/patients").catch(() => ({ data: [] })),
          API.get("/appointments").catch(() => ({ data: [] })),
          API.get("/pharmacy/requests?status=pending").catch(() => ({ data: [] })),
          API.get("/pharmacy/inventory").catch(() => ({ data: { data: [] } })),
          API.get("/laboratory/requests").catch(() => ({ data: [] })), // adjust path if your lab route differs
        ]);

        // 1. Calculate Today's Appointments
        const today = new Date().toDateString();
        const appointmentsToday = (appointmentsRes.data || []).filter(
          (a) => new Date(a.appointmentDate).toDateString() === today
        ).length;

        setStats({
          totalStaff: staffRes.data?.staff?.length || 0,
          totalPatients: patientsRes.data?.length || 0,
          appointmentsToday,
        });

        // 2. Pharmacy Metrics processing
        const pendingPrescriptions = pharmacyReqRes.data?.data || pharmacyReqRes.data || [];
        setPharmacyQueue(pendingPrescriptions);

        const fullInventory = inventoryRes.data?.data || [];
        // Filter out stock dipping below its Reorder Alert Point
        const flaggedStock = fullInventory.filter(item => item.totalStock <= item.reorderLevel);
        setLowStockItems(flaggedStock);

        // 3. Lab Metrics processing
        setLabRequests(labRes.data || []);

        // 4. Clinical Metrics Mock/Calculation based on appointments
        const activeConsultations = (appointmentsRes.data || []).filter(a => a.status === "ongoing").length;
        const waitingCount = (appointmentsRes.data || []).filter(a => a.status === "scheduled" || a.status === "pending").length;
        setClinicalStats({ activeConsultations, waitingCount });

      } catch (err) {
        console.error("Failed to compile dashboard data matrix", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, []);

  const cards = [
    { label: "Total Staff", value: stats.totalStaff, color: "text-blue-700", bg: "bg-blue-50", path: "/staff" },
    { label: "Total Patients", value: stats.totalPatients, color: "text-green-600", bg: "bg-green-50", path: "/patients" },
    { label: "Appointments Today", value: stats.appointmentsToday, color: "text-purple-600", bg: "bg-purple-50", path: "/appointments" },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">WELCOME admin</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time facility orchestration metrics across active wings.</p>
        </div>
        <div className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Stream System Synced
        </div>
      </div>

      {/* 📊 TOP LEVEL HIGH-VALUE COUNTER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            className={`${card.bg} rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition hover:scale-[1.02] border border-gray-100`}
          >
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">{card.label}</p>
            <div className="flex justify-between items-baseline mt-2">
              <h2 className={`text-4xl font-extrabold ${card.color}`}>{card.value}</h2>
              <span className={`text-xs ${card.color} font-semibold underline`}>Open Log →</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 TWO COLUMN UX ENGAGEMENT HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COMPONENT: MULTI-DEPARTMENT TRACKER CARD (SPANS 2 COLS) */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800">Department Tracking Subsystems</h3>
              <p className="text-gray-400 text-xs">Monitor current patient workflows across active logs.</p>
            </div>
            
            {/* COMPACT DEPT TABS */}
            <div className="flex bg-gray-200/80 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
              <button 
                onClick={() => setActiveDeptTab("clinical")}
                className={`px-3 py-1.5 rounded-md transition ${activeDeptTab === "clinical" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
              >
                🩺 Clinical
              </button>
              <button 
                onClick={() => setActiveDeptTab("laboratory")}
                className={`px-3 py-1.5 rounded-md transition ${activeDeptTab === "laboratory" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
              >
                🔬 Laboratory ({labRequests.length})
              </button>
              <button 
                onClick={() => setActiveDeptTab("pharmacy")}
                className={`px-3 py-1.5 rounded-md transition ${activeDeptTab === "pharmacy" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
              >
                💊 Pharmacy ({pharmacyQueue.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Parsing network diagnostics...</div>
            ) : (
              <>
                {/* CLINICAL DEPT LAYOUT */}
                {activeDeptTab === "clinical" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                        <p className="text-xs text-blue-600 font-bold uppercase">Active Consultations</p>
                        <p className="text-2xl font-black text-blue-900 mt-1">{clinicalStats.activeConsultations}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
                        <p className="text-xs text-amber-600 font-bold uppercase">Patients Waiting</p>
                        <p className="text-2xl font-black text-amber-900 mt-1">{clinicalStats.waitingCount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <button onClick={() => navigate("/clinical")} className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-lg transition">
                        Launch Consultation Console →
                      </button>
                    </div>
                  </div>
                )}

                {/* LABORATORY DEPT LAYOUT */}
                {activeDeptTab === "laboratory" && (
                  <div className="space-y-4">
                    {labRequests.length === 0 ? (
                      <p className="text-gray-400 text-sm py-6 text-center">No active work orders inside diagnostic pipeline.</p>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-1">
                        {labRequests.slice(0, 4).map((req, idx) => (
                          <div key={req._id || idx} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-gray-800">{req.patient?.fullName || "Walk-In Specimen"}</p>
                              <p className="text-gray-400 mt-0.5">Test: <span className="text-gray-600">{req.testType || "General Panels"}</span></p>
                            </div>
                            <span className={`px-2 py-0.5 font-bold rounded-full capitalize ${req.status === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700 animate-pulse"}`}>
                              {req.status || "processing"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-right pt-2">
                      <button onClick={() => navigate("/laboratory")} className="text-xs font-bold text-teal-600 hover:underline bg-teal-50 px-3 py-2 rounded-lg transition">
                        Access Laboratory Information System →
                      </button>
                    </div>
                  </div>
                )}

                {/* PHARMACY DEPT LAYOUT */}
                {activeDeptTab === "pharmacy" && (
                  <div className="space-y-4">
                    {pharmacyQueue.length === 0 ? (
                      <p className="text-gray-400 text-sm py-6 text-center">Prescription workspace queues are completely clear.</p>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-1">
                        {pharmacyQueue.slice(0, 4).map((order, idx) => (
                          <div key={order._id || idx} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-gray-800">{order.patient?.fullName || "Walk-in Patient"}</p>
                              <p className="text-gray-400 mt-0.5 truncate max-w-[280px]">
                                {Array.isArray(order.medications) ? order.medications.map(m => m.drugName || m.medicine).join(", ") : "Items ready"}
                              </p>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 font-bold rounded-full">
                              Waiting Checkout
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-right pt-2">
                      <button onClick={() => navigate("/pharmacy")} className="text-xs font-bold text-purple-600 hover:underline bg-purple-50 px-3 py-2 rounded-lg transition">
                        Open Pharmacy Dispensation Screen →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: CRITICAL MEDICAL INVENTORY LOG ALERTS (SPANS 1 COL) */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                  ⚠️ Inventory Safety Monitors
                </h3>
                <p className="text-gray-400 text-xs">Auto-scanning stock levels against safety targets.</p>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded ${lowStockItems.length > 0 ? "bg-red-100 text-red-700 animate-bounce" : "bg-green-100 text-green-700"}`}>
                {lowStockItems.length} Warnings
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400 text-xs">Parsing stock alerts...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">✅</span>
                <p className="font-medium text-gray-500">All drug stock volumes are inside normal safety boundaries.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item._id} className="p-2.5 rounded-lg border border-red-50 bg-red-50/20 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-800">{item.itemName}</p>
                      <p className="text-gray-400 mt-0.5">Reorder Limit Mark: <span className="font-semibold text-gray-600">{item.reorderLevel} units</span></p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-red-600 bg-white shadow-sm border border-red-200 px-2 py-1 rounded">
                        {item.totalStock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button 
              onClick={() => navigate("/pharmacy")} 
              className="w-full text-center bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-sm"
            >
              Order Replenishments Batch
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;