import mongoose from "mongoose";

const radiologyRequestSchema = new mongoose.Schema(
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
    scanType: {
      type: String,
      enum: [
        "X-Ray",
        "Ultrasound",
        "CT Scan",
        "MRI",
        "Mammogram",
        "Fluoroscopy",
        "PET Scan",
        "DEXA Scan",
        "Other",
      ],
      required: [true, "Scan type is required"],
    },
    bodyPart: {
      type: String,
      required: [true, "Body part is required"],
    },
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine",
    },
    clinicalNotes: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
    findings: {
      type: String,
      default: null,
    },
    impression: {
      type: String,
      default: null,
    },
    reportedAt: {
      type: Date,
      default: null,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true }
);

const RadiologyRequest = mongoose.model("RadiologyRequest", radiologyRequestSchema);

export default RadiologyRequest;