import Billing from "../billing/billing.model.js";

export const getRevenueSummary = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $project: {
          updatedAt: 1,
          consultationRevenue: { $ifNull: ["$consultation.fee", 0] },
          labRevenue: { $sum: "$labCharges.cost" },
          pharmacyRevenue: { $sum: "$pharmacyCharges.cost" },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" }
          },
          totalDailyRevenue: { $sum: "$totalAmount" },
          totalConsultation: { $sum: "$consultationRevenue" },
          totalLab: { $sum: "$labRevenue" },
          totalPharmacy: { $sum: "$pharmacyRevenue" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
      { $limit: 30 }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch revenue data", error: error.message });
  }
};

export const getDepartmentRevenue = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          consultationRevenue: { $sum: "$consultation.fee" },
          labRevenue: { $sum: { $sum: "$labCharges.cost" } },
          pharmacyRevenue: { $sum: { $sum: "$pharmacyCharges.cost" } },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch department revenue", error: error.message });
  }
};

export const getPaymentMethodRevenue = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment method revenue", error: error.message });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" }
          },
          totalRevenue: { $sum: "$totalAmount" },
          totalConsultation: { $sum: "$consultation.fee" },
          totalLab: { $sum: { $sum: "$labCharges.cost" } },
          totalPharmacy: { $sum: { $sum: "$pharmacyCharges.cost" } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch monthly revenue", error: error.message });
  }
};

export const getYearlyRevenue = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: { $year: "$updatedAt" },
          totalRevenue: { $sum: "$totalAmount" },
          totalConsultation: { $sum: "$consultation.fee" },
          totalLab: { $sum: { $sum: "$labCharges.cost" } },
          totalPharmacy: { $sum: { $sum: "$pharmacyCharges.cost" } },
          totalTransactions: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch yearly revenue", error: error.message });
  }
};