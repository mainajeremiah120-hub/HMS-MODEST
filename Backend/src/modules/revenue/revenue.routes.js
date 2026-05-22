import express from "express";
import { 
  getRevenueSummary,
  getDepartmentRevenue,
  getPaymentMethodRevenue,
  getMonthlyRevenue,
  getYearlyRevenue
} from "./revenue.controller.js";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", protect, getRevenueSummary);
router.get("/department", protect, getDepartmentRevenue);
router.get("/payment-method", protect, getPaymentMethodRevenue);
router.get("/monthly", protect, getMonthlyRevenue);
router.get("/yearly", protect, getYearlyRevenue);

export default router;