import mongoose from "mongoose";

const labRequestSchema = new mongoose.Schema(
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
    testName: {
      type: String,
      required: [true, "Test name is required"],
    },
    testType: {
      type: String,
      enum: [
        "Blood Test",
        "Urine Test",
        "Stool Test",
        "Culture & Sensitivity",
        "HIV Test",
        "Malaria Test",
        "Liver Function Test",
        "Kidney Function Test",
        "Full Blood Count",
        "Blood Sugar",
        "Lipid Profile",
        "Thyroid Function",
        "Other",
      ],
      required: true,
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
    results: [
      {
        parameter: String,
        value: String,
        unit: String,
        referenceRange: String,
        flag: String,
        loincCode: String
      }
    ],
    interpretation: {
      type: String,
      default: null,
    },
    labNotes: {
      type: String,
      default: null,
    },
    resultUploadedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true }
);

const LabRequest = mongoose.model("LabRequest", labRequestSchema);

export default LabRequest;