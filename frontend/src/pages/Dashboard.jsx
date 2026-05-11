import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStaff: "--",
    totalPatients: "--",
    appointmentsToday: "--",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [staffRes, patientsRes, appointmentsRes] = await Promise.all([
          API.get("/staff"),
          API.get("/patients"),
          API.get("/appointments"),
        ]);

        const today = new Date().toDateString();
        const appointmentsToday = appointmentsRes.data.filter(
          (a) => new Date(a.appointmentDate).toDateString() === today
        ).length;

        setStats({
          totalStaff: staffRes.data.staff.length,
          totalPatients: patientsRes.data.length,
          appointmentsToday,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Total Staff", value: stats.totalStaff, color: "text-blue-700", bg: "bg-blue-50", path: "/staff" },
    { label: "Total Patients", value: stats.totalPatients, color: "text-green-600", bg: "bg-green-50", path: "/patients" },
    { label: "Appointments Today", value: stats.appointmentsToday, color: "text-purple-600", bg: "bg-purple-50", path: "/appointments" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            className={`${card.bg} rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition hover:scale-105 hover:bg-white`}
          >
            <p className="text-gray-500 text-sm">{card.label}</p>
            <h2 className={`text-3xl font-bold ${card.color} mt-1`}>{card.value}</h2>
            <p className={`text-sm ${card.color} mt-2 font-medium`}>View all →</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;