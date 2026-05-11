import express from "express";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";
import {
  getAllLabRequests,
  getLabRequestById,
  getTemplate,
  processLabRequest,
  uploadLabResult,
  getCompletedLabRequests,
  getPatientLabHistory,
  cancelLabRequest,
} from "./lab.controller.js";

const router = express.Router();

const labAccess = authorizeRoles("admin", "nurse","doctor", "lab");

// Get all pending/processing requests
router.get("/requests", protect, labAccess, getAllLabRequests);

// Get completed requests
router.get("/requests/completed", protect, labAccess, getCompletedLabRequests);

// Get single request with template
router.get("/requests/:id", protect, labAccess, getLabRequestById);

// Get template for a test type
router.get("/template/:testType", protect, labAccess, getTemplate);

// Mark as processing
router.put("/requests/:id/process", protect, labAccess, processLabRequest);

// Upload results
router.put("/requests/:id/result", protect, labAccess, uploadLabResult);

// Cancel request
router.put("/requests/:id/cancel", protect, labAccess, cancelLabRequest);

// Patient lab history
router.get("/patients/:patientId", protect, labAccess, getPatientLabHistory);

export default router;