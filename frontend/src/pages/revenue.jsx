import React, { useState, useEffect } from "react";
import API from "../api/axios";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Revenue() {
  const [summary, setSummary] = useState([]);
  const [department, setDepartment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const COLORS = ["#0066CC", "#22C55E", "#FF6B6B", "#FFD700"];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, deptRes, paymentRes, monthlyRes, yearlyRes] = await Promise.all([
        API.get("/revenue/summary"),
        API.get("/revenue/department"),
        API.get("/revenue/payment-method"),
        API.get("/revenue/monthly"),
        API.get("/revenue/yearly")
      ]);

      setSummary([...summaryRes.data].reverse());
      setDepartment(deptRes.data);
      setPaymentMethod(paymentRes.data);
      setMonthly(monthlyRes.data);
      setYearly(yearlyRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch revenue data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin">
          <div className="text-4xl">⏳</div>
        </div>
        <p className="text-gray-600 font-semibold mt-4">Loading revenue data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
             Revenue Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive hospital revenue analytics</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        {department && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-600">
              <p className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</p>
              <p className="text-3xl font-black text-blue-600">
                KSh {department.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-600">
              <p className="text-gray-600 text-sm font-semibold mb-2">Consultation</p>
              <p className="text-3xl font-black text-green-600">
                KSh {department.consultationRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-600">
              <p className="text-gray-600 text-sm font-semibold mb-2">Lab Revenue</p>
              <p className="text-3xl font-black text-purple-600">
                KSh {department.labRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-amber-600">
              <p className="text-gray-600 text-sm font-semibold mb-2">Pharmacy</p>
              <p className="text-3xl font-black text-amber-600">
                KSh {department.pharmacyRevenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-bold transition ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-6 py-3 font-bold transition ${
              activeTab === "monthly"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
             Monthly
          </button>
          <button
            onClick={() => setActiveTab("yearly")}
            className={`px-6 py-3 font-bold transition ${
              activeTab === "yearly"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-6 py-3 font-bold transition ${
              activeTab === "payment"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
             Payment
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Revenue (Last 30 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(item) => `${item._id.day}/${item._id.month}`} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="totalDailyRevenue" 
                    stroke="#0066CC" 
                    strokeWidth={2}
                    dot={{ fill: "#0066CC", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Department Revenue Pie */}
            {department && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue by Department</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Consultation", value: department.consultationRevenue || 0 },
                        { name: "Lab", value: department.labRevenue || 0 },
                        { name: "Pharmacy", value: department.pharmacyRevenue || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: KSh ${value?.toLocaleString() || 0}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `KSh ${value?.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Department Breakdown Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Transactions by Department</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: "Consultation", count: department?.totalTransactions || 0, fill: "#0066CC" },
                    { name: "Lab", count: summary.reduce((sum, item) => sum + item.transactionCount, 0) / 3 || 0, fill: "#22C55E" },
                    { name: "Pharmacy", count: summary.reduce((sum, item) => sum + item.transactionCount, 0) / 3 || 0, fill: "#FF6B6B" }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0066CC" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Breakdown Table */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Transactions</span>
                  <span className="text-blue-600 font-bold text-lg">{department?.totalTransactions || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Average Per Transaction</span>
                  <span className="text-green-600 font-bold text-lg">
                    KSh {Math.round((department?.totalRevenue || 0) / (department?.totalTransactions || 1))?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Days Tracked</span>
                  <span className="text-purple-600 font-bold text-lg">{summary.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Tab */}
        {activeTab === "monthly" && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Monthly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(item) => `${item._id.month}/${item._id.year}`} />
                <YAxis />
                <Tooltip formatter={(value) => `KSh ${value?.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#0066CC" name="Total Revenue" />
                <Bar dataKey="totalConsultation" fill="#22C55E" name="Consultation" />
                <Bar dataKey="totalLab" fill="#FF6B6B" name="Lab" />
                <Bar dataKey="totalPharmacy" fill="#FFD700" name="Pharmacy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Yearly Tab */}
        {activeTab === "yearly" && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Yearly Revenue Summary</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" label={{ value: "Year", position: "insideBottomRight", offset: -5 }} />
                <YAxis />
                <Tooltip formatter={(value) => `KSh ${value?.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#0066CC" name="Total Revenue" />
                <Bar dataKey="totalConsultation" fill="#22C55E" name="Consultation" />
                <Bar dataKey="totalLab" fill="#FF6B6B" name="Lab" />
                <Bar dataKey="totalPharmacy" fill="#FFD700" name="Pharmacy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Method Tab */}
        {activeTab === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method Distribution</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={paymentMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, totalAmount }) => `${_id}: KSh ${totalAmount?.toLocaleString()}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalAmount"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `KSh ${value?.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method Details</h2>
              <div className="space-y-3">
                {paymentMethod.map((method, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-600">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">{method._id}</span>
                      <span className="text-blue-600 font-bold">KSh {method.totalAmount?.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Transactions: {method.transactionCount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAllData}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-105"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default Revenue;