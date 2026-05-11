import express from "express";
import {
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff
} from "./staff.controller.js";

import { protect, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = express.Router();

// 👑 ONLY ADMIN CAN MANAGE STAFF
router.post("/", protect, authorizeRoles("admin"), createStaff);
router.get("/", protect, authorizeRoles("admin","receptionist"), getStaff);
router.put("/:id", protect, authorizeRoles("admin"), updateStaff);
router.delete("/:id", protect, authorizeRoles("admin"), deleteStaff);

export default router;