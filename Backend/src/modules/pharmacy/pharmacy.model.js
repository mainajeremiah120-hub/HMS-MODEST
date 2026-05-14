import mongoose from "mongoose";

// Sub-schema for individual medications in a request
const medicationItemSchema = new mongoose.Schema({
  medicine: { 
    type: String, // You can link this to an Inventory ID later
    required: true 
  },
  dosage: { type: String, default: null },
  frequency: { type: String, default: null },
  duration: { type: String, default: null },
  quantityRequested: { type: Number, required: true },
  quantityDispensed: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  instructions: { type: String, default: null }
});

const pharmacyRequestSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: [true, "Doctor is required"],
    },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      default: null,
    },
    medications: [medicationItemSchema], // Mirroring your Lab "results" array
    status: {
      type: String,
      enum: ["pending", "awaiting-payment", "completed", "cancelled"],
      default: "pending",
    },
    billDetails: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
        name: String,
        quantity: Number,
        price: Number,
      }
    ],
    totalAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    pharmacistNotes: { type: String, default: null },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    dispensedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// This is the line your controller was looking for!
const PharmacyRequest = mongoose.model("PharmacyRequest", pharmacyRequestSchema);

export default PharmacyRequest;