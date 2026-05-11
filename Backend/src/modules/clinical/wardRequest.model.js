import mongoose from "mongoose";

const wardRequestSchema = new mongoose.Schema(
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
    wardType: {
      type: String,
      enum: [
        "General Ward",
        "ICU",
        "Maternity",
        "Pediatric",
        "Surgical",
        "Isolation",
        "Emergency",
        "Other",
      ],
      required: [true, "Ward type is required"],
    },
    admissionReason: {
      type: String,
      required: [true, "Admission reason is required"],
    },
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine",
    },
    status: {
      type: String,
      enum: ["pending", "admitted", "discharged", "transferred", "cancelled"],
      default: "pending",
    },
    bedNumber: {
      type: String,
      default: null,
    },
    admittedAt: {
      type: Date,
      default: null,
    },
    dischargedAt: {
      type: Date,
      default: null,
    },
    nurseNotes: {
      type: String,
      default: null,
    },
    progressNotes: [
      {
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true }
);

const WardRequest = mongoose.model("WardRequest", wardRequestSchema);

export default WardRequest;