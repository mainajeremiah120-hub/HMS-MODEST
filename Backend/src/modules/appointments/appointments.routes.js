import express from "express";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  approveAppointment,
  rejectAppointment,
  cancelAppointment,
  completeAppointment,
  reassignAppointment,
  deleteAppointment,
} from "./appointments.controller.js";

const router = express.Router();

router.post("/", protect, createAppointment);
router.get("/", protect, getAllAppointments);
router.get("/:id", protect, getAppointmentById);
router.put("/:id", protect, updateAppointment);
router.put("/:id/approve", protect, authorizeRoles("doctor"), approveAppointment);
router.put("/:id/reject", protect, authorizeRoles("doctor"), rejectAppointment);
router.put("/:id/cancel", protect, cancelAppointment);
router.put("/:id/complete", protect, authorizeRoles("doctor"), completeAppointment);
router.put("/:id/reassign", protect, authorizeRoles("admin"), reassignAppointment);
router.delete("/:id", protect, authorizeRoles("admin"), deleteAppointment);

export default router;