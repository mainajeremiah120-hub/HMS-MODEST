// models/billing.model.js
import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    // Track consultation specifics directly inside the centralized bill
    consultation: {
      consultationId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation" },
      fee: { type: Number, default: 500 }, // Standard default consultation fee (e.g., 500 KES)
      status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    },
    // Ready-made buckets for the next modules we tackle
    labCharges: [
      {
        labRequestId: { type: mongoose.Schema.Types.ObjectId },
        testName: String,
        cost: { type: Number, default: 0 },
        status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
      },
    ],
    pharmacyCharges: [
      {
        prescriptionId: { type: mongoose.Schema.Types.ObjectId },
        drugName: String,
        quantity: Number,
        cost: { type: Number, default: 0 },
        status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "M-Pesa", "Insurance", "Unpaid"],
      default: "Unpaid",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // Cashier, Admin, or Receptionist who completes the transaction
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate total live expenditure automatically across arrays
billingSchema.pre("save", function (next) {
  const consultationAmt = this.consultation ? this.consultation.fee : 0;
  const labAmt = this.labCharges.reduce((sum, item) => sum + item.cost, 0);
  const pharmacyAmt = this.pharmacyCharges.reduce((sum, item) => sum + item.cost, 0);

  this.totalAmount = consultationAmt + labAmt + pharmacyAmt;
  next();
});

const Billing = mongoose.model("Billing", billingSchema);
export default Billing;