import mongoose from "mongoose";

const vitalSchema = new mongoose.Schema({
  bloodPressure: { type: String, default: null },
  temperature: { type: String, default: null },
  pulse: { type: String, default: null },
  weight: { type: String, default: null },
  height: { type: String, default: null },
  oxygenSaturation: { type: String, default: null },
  respiratoryRate: { type: String, default: null },
});

const consultationSchema = new mongoose.Schema(
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    symptoms: {
      type: String,
      required: [true, "Symptoms are required"],
    },
    diagnosis: {
      type: String,
      default: null,
    },
    icd10Code: {
      type: String,
      default: null,
    },
    icd10Description: {
      type: String,
      default: null,
    },
    aiSuggestedDiagnosis: {
      type: String,
      default: null,
    },
    vitals: {
      type: vitalSchema,
      default: {},
    },
    notes: {
      type: String,
      default: null,
    },
        // Clinical Assessment Fields
    chiefComplaint: {
      type: String,
      default: null,
    },
    historyOfPresentingIllness: {
      type: String,
      default: null,
    },
    reviewOfOtherSystems: {
      type: String,
      default: null,
    },
    surgicalHistory: {
      type: String,
      default: null,
    },
    familyHistory: {
      type: String,
      default: null,
    },
    systemicExamination: {
      type: String,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "completed"],
      default: "open",
    },
  },
  { timestamps: true }
);

const Consultation = mongoose.model("Consultation", consultationSchema);

export default Consultation;