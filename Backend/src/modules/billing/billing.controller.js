import Billing from "../models/billing.model.js";

// @desc    Get all active unpaid or pending balance patient files for billing dashboard
// @route   GET /api/billing/pool
// @access  Cashier, Admin, Reception
export const getCashierPool = async (req, res) => {
  try {
    // Check if user has permission
    const allowedRoles = ['admin', 'cashier', 'reception'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Unauthorized billing staff tier." });
    }

    const pool = await Billing.find({ paymentStatus: { $ne: "Paid" } })
      .populate("patient", "fullName phone gender identityCard Number")
      .sort({ updatedAt: -1 });

    res.status(200).json(pool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};