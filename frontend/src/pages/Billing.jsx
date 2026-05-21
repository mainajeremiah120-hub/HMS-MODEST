import React, { useState, useEffect } from "react";
import API from "../api/axios"; // Adjust path to point to your axios instance

function Billing() {
  const [billingPool, setBillingPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]); // Add this
  const [activeTab, setActiveTab] = useState("pending"); // Add this

  // Modal & Processing State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch all pending bills from the live cashier pool
  const fetchBillingPool = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/billing/pool");
      setBillingPool(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cashier billing pool.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingPool();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poolRes, historyRes] = await Promise.all([
        API.get("/billing/pool"),
        API.get("/billing/history")
      ]);
      setBillingPool(poolRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      setError("Failed to load billing data.");
    } finally {
      setLoading(false);
    }
  };

  // Ensure your useEffect calls this instead
  useEffect(() => {
    fetchData();
  }, []);

  // Handle invoice clearing form submission
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setProcessingPayment(true);
    setError("");
    setSuccess("");

    try {
      await API.put(`/billing/${selectedInvoice._id}/pay`, { paymentMethod });
      setSuccess(`Invoice for ${selectedInvoice.patient?.fullName} cleared successfully!`);
      setSelectedInvoice(null); // Close Modal
      fetchBillingPool(); // Refresh list to drop the cleared bill
    } catch (err) {
      setError(err.response?.data?.message || "Transaction settlement failed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Bar Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cashier Counter</h1>
          <p className="text-sm text-gray-500">Manage pending bills, patient invoice pools, and collections.</p>
        </div>
        <button
          onClick={fetchBillingPool}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🔄 Refresh Pool
        </button>
      </div>

      {/* Alert Banners */}
      {success && <div className="bg-green-100 text-green-700 border border-green-200 px-4 py-3 rounded-xl text-sm font-medium">{success}</div>}
      {error && <div className="bg-red-100 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}
      <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "pending" ? "bg-white shadow" : "text-gray-500"}`}
        >
          Pending ({billingPool.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "history" ? "bg-white shadow" : "text-gray-500"}`}
        >
          History
        </button>
      </div>
      {/* Active Pool Overview Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/70">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            📋 Pending Invoices
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {billingPool.length} Waiting
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading cash records...</div>
        ) : billingPool.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            🎉 Visual clearing complete! No pending patient balances currently in queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Contact Line</th>
                  <th className="px-6 py-3.5">Unpaid Breakdowns</th>
                  <th className="px-6 py-3.5 text-right">Total Amount Due</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billingPool.map((bill) => {
                  // Figure out dynamic counts to build a badge view
                  const hasConsultation = bill.consultation?.status === "Pending";
                  const pendingLabsCount = bill.labCharges?.filter(l => l.status === "Pending").length || 0;
                  const pendingPharmCount = bill.pharmacyCharges?.filter(p => p.status === "Pending").length || 0;

                  return (
                    <tr key={bill._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {bill.patient?.fullName || "Walk-In / Unknown"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{bill.patient?.phone || "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {hasConsultation && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                              🩺 Consult (KSh {bill.consultation.fee})
                            </span>
                          )}
                          {pendingLabsCount > 0 && (
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                              🧪 Labs ({pendingLabsCount})
                            </span>
                          )}
                          {pendingPharmCount > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                              💊 Meds ({pendingPharmCount})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">
                        KSh {bill.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedInvoice(bill);
                            setPaymentMethod("Cash"); // Default fallback option reset
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
                        >
                          Collect Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP MODAL: PAYMENT CHECKOUT DISPATCH PANEL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title header */}
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Process Patient Payment</h3>
                <p className="text-xs text-gray-400">Patient: {selectedInvoice.patient?.fullName}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-white transition text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Bill Line-Itemized Review List */}
            <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Invoice Summary Breakdowns
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-200 p-2 max-h-48 overflow-y-auto">
                  {selectedInvoice.consultation?.status === "Pending" && (
                    <div className="flex justify-between items-center py-2 px-3 text-sm">
                      <span className="text-gray-600">🩺 Consultation Fee</span>
                      <span className="font-semibold text-gray-800">KSh {selectedInvoice.consultation.fee}</span>
                    </div>
                  )}
                  {selectedInvoice.labCharges?.map((lab, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 text-sm">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        🧪 Lab Test: <span className="font-medium text-gray-800">{lab.testName}</span>
                      </span>
                      <span className="font-semibold text-gray-800">KSh {lab.cost}</span>
                    </div>
                  ))}
                  {selectedInvoice.pharmacyCharges?.map((pharma, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 text-sm">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        💊 Drug: <span className="font-medium text-gray-800">{pharma.drugName}</span> (x{pharma.quantity})
                      </span>
                      <span className="font-semibold text-gray-800">KSh {pharma.cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total Bar Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Total Payable Balance:</span>
                <span className="text-2xl font-black text-blue-900">KSh {selectedInvoice.totalAmount?.toLocaleString()}</span>
              </div>

              {/* Payment Method Selector Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Settlement Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                >
                  <option value="Cash">💵 Cash Settlement</option>
                  <option value="M-Pesa">📱 Safaricom M-Pesa</option>
                  <option value="Insurance">🛡️ Corporate Insurance Cover</option>
                </select>
              </div>

              {/* Actions Action Drawer Footers */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-1/3 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="w-2/3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 text-sm"
                >
                  {processingPayment ? "Processing Settlement..." : "Confirm Payment & Clear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;