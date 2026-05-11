import express from "express";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "./patients.controller.js";

const router = express.Router();

router.post("/", protect, createPatient);
router.get("/", protect, getAllPatients);
router.get("/:id", protect, getPatientById);
router.put("/:id", protect, updatePatient);
router.delete("/:id", protect, authorizeRoles("admin"), deletePatient);

export default router;