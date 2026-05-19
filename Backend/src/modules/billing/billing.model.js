import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    consultation: {
      consultationId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation" },
      fee: { type: Number, default: 500 },
      status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    },
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
      ref: "User", // Matches standard auth token references
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook updated to be next-agnostic
billingSchema.pre("save", function () {
  const consultationAmt = this.consultation ? (this.consultation.fee || 0) : 0;
  const labAmt = this.labCharges.reduce((sum, item) => sum + (item.cost || 0), 0);
  const pharmacyAmt = this.pharmacyCharges.reduce((sum, item) => sum + (item.cost || 0), 0);

  this.totalAmount = consultationAmt + labAmt + pharmacyAmt;
  // No 'next()' call needed here
});

const Billing = mongoose.model("Billing", billingSchema);
export default Billing;