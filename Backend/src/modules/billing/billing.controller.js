import Billing from "./billing.model.js";

// @desc    Get all active unpaid or pending balance patient files for billing dashboard
// @route   GET /api/billing/pool
// @access  Cashier, Admin, Reception
export const getCashierPool = async (req, res) => {
  try {
    const pool = await Billing.find({ paymentStatus: { $ne: "Paid" } })
      .populate("patient", "fullName phone gender identityCard Number")
      .sort({ updatedAt: -1 });

    res.status(200).json(pool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all completed (paid) payment records for history
// @route   GET /api/billing/history
// @access  Cashier, Admin, Reception
export const getPaymentHistory = async (req, res) => {
  try {
    const history = await Billing.find({ paymentStatus: "Paid" })
      .populate("patient", "fullName phone")
      .sort({ updatedAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};


// @desc    Process payment and clear pending balances for an invoice
// @route   PUT /api/billing/:id/pay
// @access  Cashier, Admin, Reception
export const settleInvoice = async (req, res) => {
  try {
    const { paymentMethod } = req.body; // Expects "Cash", "M-Pesa", or "Insurance"
    
    if (!paymentMethod || paymentMethod === "Unpaid") {
      return res.status(400).json({ message: "Please provide a valid payment method." });
    }

    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Billing record not found." });
    }

    if (bill.paymentStatus === "Paid") {
      return res.status(400).json({ message: "This bill has already been settled." });
    }

    // Flip statuses of all underlying line items to Paid
    if (bill.consultation) {
      bill.consultation.status = "Paid";
    }
    
    bill.labCharges = bill.labCharges.map(item => ({ ...item, status: "Paid" }));
    bill.pharmacyCharges = bill.pharmacyCharges.map(item => ({ ...item, status: "Paid" }));

    // Update global invoice settings
    bill.paymentStatus = "Paid";
    bill.paymentMethod = paymentMethod;
    bill.processedBy = req.user._id || req.user.id; // Fallback support for both token structures

    await bill.save();
    res.status(200).json({ message: "Payment processed and cleared successfully!", bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};