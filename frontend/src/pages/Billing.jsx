import React, { useState, useEffect } from "react";
import API from "../api/axios"; // Adjust path to point to your axios instance

function Billing() {
  const [billingPool, setBillingPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

  // Modal & Processing State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [processingPayment, setProcessingPayment] = useState(false);

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
      fetchData(); // Refresh list to update both pool and history
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
          onClick={fetchData}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Alert Banners */}
      {success && <div className="bg-green-100 text-green-700 border border-green-200 px-4 py-3 rounded-xl text-sm font-medium">{success}</div>}
      {error && <div className="bg-red-100 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}

      {/* Tab Navigation */}
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

      {/* Conditional Content Rendering */}
      {activeTab === "pending" ? (
        <>
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
                    {billingPool.map((bill) => (
                      <tr key={bill._id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-gray-800">{bill.patient?.fullName || "Walk-In / Unknown"}</td>
                        <td className="px-6 py-4 text-gray-600">{bill.patient?.phone || "N/A"}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {bill.consultation?.status === "Pending" && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">🩺 Consult</span>}
                            {bill.labCharges?.filter(l => l.status === "Pending").length > 0 && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">🧪 Labs</span>}
                            {bill.pharmacyCharges?.filter(p => p.status === "Pending").length > 0 && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">💊 Meds</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">KSh {bill.totalAmount?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => { setSelectedInvoice(bill); setPaymentMethod("Cash"); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition">Collect Payment</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Process Patient Payment</h3>
                    <p className="text-xs text-gray-400">Patient: {selectedInvoice.patient?.fullName}</p>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-800 uppercase">Total Due:</span>
                    <span className="text-2xl font-black text-blue-900">KSh {selectedInvoice.totalAmount?.toLocaleString()}</span>
                  </div>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 font-medium text-gray-800">
                    <option value="Cash">💵 Cash Settlement</option>
                    <option value="M-Pesa">📱 Safaricom M-Pesa</option>
                    <option value="Insurance">🛡️ Corporate Insurance Cover</option>
                  </select>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setSelectedInvoice(null)} className="w-1/3 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 text-sm">Cancel</button>
                    <button type="submit" disabled={processingPayment} className="w-2/3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {processingPayment ? "Processing..." : "Confirm Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-600">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Services Performed</th>
                <th className="px-6 py-3">Paid Amount</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Date Settled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map(bill => (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{bill.patient?.fullName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {bill.consultation && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">CONSULT</span>}
                      {bill.labCharges?.map((l, i) => (
                        <span key={i} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {l.testName}
                        </span>
                      ))}
                      {bill.pharmacyCharges?.map((p, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {p.drugName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">KSh {bill.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4">{bill.paymentMethod}</td>
                  <td className="px-6 py-4">{new Date(bill.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Billing;