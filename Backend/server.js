import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import staffRoutes from "./src/modules/staff/staff.routes.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import patientRoutes from "./src/modules/patients/patients.routes.js";
import appointmentRoutes from "./src/modules/appointments/appointments.routes.js";
import appointmentExpiryJob from "./src/jobs/appointmentExpiry.job.js";
import appointmentReminderJob from "./src/jobs/appointmentReminder.job.js";
import receptionRoutes from "./src/modules/reception/reception.routes.js";
import clinicalRoutes from "./src/modules/clinical/clinical.routes.js";
import labRoutes from "./src/modules/lab/lab.routes.js";
import pharmacyRoutes from './src/modules/pharmacy/pharmacy.route.js';
import billingRoutes from "./src/modules/billing/billingRoutes.js";
import revenueRoutes from "./src/modules/revenue/revenue.routes.js";

dotenv.config({ path: "./.env" });

connectDB();
appointmentExpiryJob();
appointmentReminderJob();


const app = express();

const cors = require('cors');
app.use(cors({
  origin: ["http://localhost:5173", "https://hms-modest-1.onrender.com"],
  credentials: true
}));
app.use(express.json());
app.use("/api/staff", staffRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/lab", labRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/revenue", revenueRoutes);
// AUTH ROUTES
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hospital Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});