import React, { useState, useEffect } from "react";
import API from "../api/axios";

function Billing() {
  const [billingPool, setBillingPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [processingPayment, setProcessingPayment] = useState(false);

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

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setProcessingPayment(true);
    setError("");
    setSuccess("");

    try {
      await API.put(`/billing/${selectedInvoice._id}/pay`, { paymentMethod });
      setSuccess(`Invoice for ${selectedInvoice.patient?.fullName} cleared successfully!`);
      setSelectedInvoice(null);
      fetchBillingPool();
    } catch (err) {
      setError(err.response?.data?.message || "Transaction settlement failed.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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

      {success && <div className="bg-green-100 text-green-700 border border-green-200 px-4 py-3 rounded-xl text-sm font-medium">{success}</div>}
      {error && <div className="bg-red-100 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}

      {/* Main Table */}
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
          <div className="p-12 text-center text-gray-400">🎉 No pending patient balances currently in queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Contact Line</th>
                  <th className="px-6 py-3.5 text-right">Total Amount Due</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billingPool.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{bill.patient?.fullName || "Walk-In"}</td>
                    <td className="px-6 py-4 text-gray-600">{bill.patient?.phone || "N/A"}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">KSh {bill.totalAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(bill)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
                      >
                        Collect Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Premium Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="print-area bg-white w-full max-w-sm overflow-hidden shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6 text-center">
              <h3 className="font-black text-xl uppercase tracking-[0.2em]">Modest Hospital</h3>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Official Medical Receipt</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Patient</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedInvoice.patient?.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Service Breakdown */}
              <div className="space-y-3 mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Breakdown</p>
                {selectedInvoice.consultation?.status === "Pending" && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Consultation Fee</span>
                    <span className="font-medium text-gray-900">KSh {selectedInvoice.consultation.fee.toLocaleString()}</span>
                  </div>
                )}
                {selectedInvoice.labCharges?.map((lab, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{lab.testName}</span>
                    <span className="font-medium text-gray-900">KSh {lab.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100 mb-8">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500">Total Due</span>
                <span className="text-2xl font-black text-blue-700">KSh {selectedInvoice.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Controls (No-Print) */}
            <div className="no-print p-6 pt-0 space-y-3">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option value="Cash">Cash Settlement</option>
                <option value="M-Pesa">Safaricom M-Pesa</option>
                <option value="Insurance">Insurance Cover</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSelectedInvoice(null)} className="py-3 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                <button onClick={() => window.print()} className="py-3 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition">Print Receipt</button>
              </div>
              
              <form onSubmit={handleProcessPayment}>
                <button type="submit" disabled={processingPayment} className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-black uppercase tracking-wider hover:bg-blue-700 transition shadow-lg">
                  {processingPayment ? "Processing..." : "Confirm & Settle"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;