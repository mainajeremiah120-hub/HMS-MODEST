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
          <div className="p-12 text-center text-gray-400">🎉 Visual clearing complete! No pending patient balances currently in queue.</div>
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
                  const hasConsultation = bill.consultation?.status === "Pending";
                  const pendingLabsCount = bill.labCharges?.filter(l => l.status === "Pending").length || 0;
                  const pendingPharmCount = bill.pharmacyCharges?.filter(p => p.status === "Pending").length || 0;

                  return (
                    <tr key={bill._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{bill.patient?.fullName || "Walk-In / Unknown"}</td>
                      <td className="px-6 py-4 text-gray-600">{bill.patient?.phone || "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {hasConsultation && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">🩺 Consult</span>}
                          {pendingLabsCount > 0 && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">🧪 Labs ({pendingLabsCount})</span>}
                          {pendingPharmCount > 0 && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">💊 Meds ({pendingPharmCount})</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">KSh {bill.totalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedInvoice(bill);
                            setPaymentMethod("Cash");
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

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          {/* Main print-area container for the receipt */}
          <div className="print-area bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden p-6">
            
            {/* Header */}
            <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
              <h3 className="font-black text-lg uppercase tracking-wider">HMS</h3>
              <p className="text-[10px] text-gray-500">Official Payment Receipt</p>
            </div>

            {/* Patient Details */}
            <div className="text-xs mb-4">
              <p><strong>Patient:</strong> {selectedInvoice.patient?.fullName}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>

            {/* Receipt Body */}
            <div className="border-t border-b border-dashed border-gray-400 py-3 space-y-2 mb-4">
              {selectedInvoice.consultation?.status === "Pending" && (
                <div className="flex justify-between text-xs"><span>Consultation</span><span>KSh {selectedInvoice.consultation.fee}</span></div>
              )}
              {selectedInvoice.labCharges?.map((lab, index) => (
                <div key={index} className="flex justify-between text-xs"><span>{lab.testName}</span><span>KSh {lab.cost}</span></div>
              ))}
              {selectedInvoice.pharmacyCharges?.map((pharma, index) => (
                <div key={index} className="flex justify-between text-xs"><span>{pharma.drugName} (x{pharma.quantity})</span><span>KSh {pharma.cost}</span></div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between font-bold text-sm mb-6">
              <span>TOTAL</span>
              <span>KSh {selectedInvoice.totalAmount?.toLocaleString()}</span>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-500 mb-6">
              <p>Thank you for choosing our services.</p>
              <p>Please keep this receipt for your records.</p>
            </div>

            {/* Controls (no-print) */}
            <form onSubmit={handleProcessPayment} className="no-print space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs">
                  <option value="Cash">Cash Settlement</option>
                  <option value="M-Pesa">Safaricom M-Pesa</option>
                  <option value="Insurance">Insurance Cover</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedInvoice(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={() => window.print()} className="flex-1 bg-gray-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-gray-700">Print</button>
                <button type="submit" disabled={processingPayment} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700">
                  {processingPayment ? "..." : "Confirm"}
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