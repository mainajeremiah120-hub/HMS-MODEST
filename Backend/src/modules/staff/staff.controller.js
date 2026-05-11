import Staff from "./staff.model.js";
import User from "../auth/auth.model.js";
import bcrypt from "bcryptjs";
import { sendStaffWelcomeEmail } from "../../services/mail.service.js";

// CREATE STAFF
export const createStaff = async (req, res) => {
  try {
    // Create staff record
    const staff = await Staff.create(req.body);

    // Auto generate password
    const defaultPassword = `HMS@${staff.fullName.split(" ")[0]}123`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create user account linked to staff
    await User.create({
      fullName: staff.fullName,
      email: staff.email,
      password: hashedPassword,
      role: staff.role,
      staffId: staff._id,
    });

    // Send welcome email with credentials
    await sendStaffWelcomeEmail({
      to: staff.email,
      fullName: staff.fullName,
      role: staff.role,
      email: staff.email,
      password: defaultPassword,
    });

    res.status(201).json({
      message: "Staff created successfully",
      staff,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL STAFF
export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json({ message: "Staff fetched successfully", staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STAFF
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Staff.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "Staff updated", staff: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE STAFF
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await Staff.findByIdAndDelete(id);
    res.json({ message: "Staff deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};