import express from "express";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  getDoctorTodayAppointments,
  getDoctorAllAppointments,
  getPatientClinicalProfile,
  suggestDiagnosis,
  createConsultation,
  getConsultation,
  updateConsultation,
  createPrescription,
  getPatientPrescriptions,
  checkDrugInteraction,
  getAllPrescriptions,
  createLabRequest,
  getPatientLabRequests,
  updateLabRequest,
  getAllLabRequests,
  createRadiologyRequest,
  getPatientRadiologyRequests,
  updateRadiologyRequest,
  getAllRadiologyRequests,
  createWardRequest,
  getPatientWardRequests,
  updateWardRequest,
  getAllWardRequests,
} from "./clinical.controller.js";


const router = express.Router();

// Appointments
router.get("/appointments", protect, authorizeRoles("doctor", "admin"), getDoctorTodayAppointments);
router.get("/appointments/all", protect, authorizeRoles("doctor", "admin"), getDoctorAllAppointments);

// Patient profile
router.get("/patients/:id", protect, authorizeRoles("doctor", "admin", "nurse"), getPatientClinicalProfile);

// AI Diagnosis
router.post("/ai/suggest-diagnosis", protect, authorizeRoles("doctor", "admin"), suggestDiagnosis);

// Consultations
router.post("/consultations", protect, authorizeRoles("doctor", "admin"), createConsultation);
router.get("/consultations/:id", protect, authorizeRoles("doctor", "admin", "nurse"), getConsultation);
router.put("/consultations/:id", protect, authorizeRoles("doctor", "admin"), updateConsultation);

// Prescriptions
router.post("/prescriptions", protect, authorizeRoles("doctor", "admin"), createPrescription);
router.get("/prescriptions", protect, authorizeRoles("pharmacist", "doctor", "admin"), getAllPrescriptions);
router.get("/prescriptions/:patientId", protect, authorizeRoles("doctor", "pharmacist", "admin"), getPatientPrescriptions);
router.post("/prescriptions/check-interaction", protect, authorizeRoles("doctor", "admin"), checkDrugInteraction);

// Lab Requests
router.post("/lab-requests", protect, authorizeRoles("doctor", "admin"), createLabRequest);
router.get("/lab-requests", protect, authorizeRoles("doctor", "admin", "nurse"), getAllLabRequests);
router.get("/lab-requests/:patientId", protect, authorizeRoles("doctor", "admin", "nurse"), getPatientLabRequests);
router.put("/lab-requests/:id/status", protect, authorizeRoles("doctor", "admin", "nurse"), updateLabRequest);

// Radiology Requests
router.post("/radiology-requests", protect, authorizeRoles("doctor", "admin"), createRadiologyRequest);
router.get("/radiology-requests", protect, authorizeRoles("doctor", "admin", "nurse"), getAllRadiologyRequests);
router.get("/radiology-requests/:patientId", protect, authorizeRoles("doctor", "admin", "nurse"), getPatientRadiologyRequests);
router.put("/radiology-requests/:id/status", protect, authorizeRoles("doctor", "admin", "nurse"), updateRadiologyRequest);

// Ward Requests
router.post("/ward-requests", protect, authorizeRoles("doctor", "admin"), createWardRequest);
router.get("/ward-requests", protect, authorizeRoles("doctor", "admin", "nurse"), getAllWardRequests);
router.get("/ward-requests/:patientId", protect, authorizeRoles("doctor", "admin", "nurse"), getPatientWardRequests);
router.put("/ward-requests/:id/status", protect, authorizeRoles("nurse", "admin"), updateWardRequest);

router.get("/test-auth", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;