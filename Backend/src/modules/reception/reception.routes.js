import express from "express";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  registerPatient,
  searchPatients,
  getPatientProfile,
  updatePatient,
  bookAppointment,
  getTodayAppointments,
  checkDoctorAvailability,
  rescheduleAppointment,
  checkInPatient,
  getQueue,
  updateQueueStatus,
  registerVisitor,
  getTodayVisitors,
  getVisitorByTicket,
  getDailyReport,
  updateVisitorStatus,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
} from "./reception.controller.js";

const router = express.Router();

const receptionAccess = authorizeRoles("admin", "receptionist");

// Patient Management
router.post("/patients", protect, receptionAccess, registerPatient);
router.get("/patients", protect, receptionAccess, searchPatients);
router.get("/patients/:id", protect, receptionAccess, getPatientProfile);
router.put("/patients/:id", protect, receptionAccess, updatePatient);
router.put("/visitors/:id/status", protect, receptionAccess, updateVisitorStatus);


// Appointment Management
router.post("/appointments", protect, receptionAccess, bookAppointment);
router.get("/appointments/today", protect, receptionAccess, getTodayAppointments);
router.get("/doctors/available", protect, receptionAccess, checkDoctorAvailability);
router.put("/appointments/:id/reschedule", protect, receptionAccess, rescheduleAppointment);

// Queue Management
router.post("/queue/checkin", protect, receptionAccess, checkInPatient);
router.get("/queue", protect, receptionAccess, getQueue);
router.put("/queue/:id/status", protect, receptionAccess, updateQueueStatus);

// Visitor Management
router.post("/visitors", protect, receptionAccess, registerVisitor);
router.get("/visitors/today", protect, receptionAccess, getTodayVisitors);
router.get("/visitors/:ticket", protect, receptionAccess, getVisitorByTicket);

// Reports
router.get("/reports/daily", protect, receptionAccess, getDailyReport);
router.get("/reports/weekly", protect, receptionAccess, getWeeklyReport);
router.get("/reports/monthly", protect, receptionAccess, getMonthlyReport);
router.get("/reports/yearly", protect, receptionAccess, getYearlyReport);

export default router;