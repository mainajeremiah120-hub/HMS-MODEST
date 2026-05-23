import express from "express";
import { 
  getRevenueSummary,
  getDepartmentRevenue,
  getPaymentMethodRevenue,
  getMonthlyRevenue,
  getYearlyRevenue,
  getWeeklyRevenue,
  getDailySummary
} from "./revenue.controller.js";
import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", protect, getRevenueSummary);
router.get("/department", protect, getDepartmentRevenue);
router.get("/payment-method", protect, getPaymentMethodRevenue);
router.get("/weekly", getWeeklyRevenue);
router.get("/monthly", protect, getMonthlyRevenue);
router.get("/yearly", protect, getYearlyRevenue);
router.get("/daily-summary", protect, getDailySummary);

export default router;