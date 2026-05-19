import express from "express";
import { getCashierPool, settleInvoice } from "./billing.controller.js";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";
const router = express.Router();

// Apply global middleware rules for the module
router.use(protect);
router.use(authorizeRoles("admin", "cashier", "reception"));

// Endpoints
router.get("/pool", getCashierPool);
router.put("/:id/pay", settleInvoice);

export default router;