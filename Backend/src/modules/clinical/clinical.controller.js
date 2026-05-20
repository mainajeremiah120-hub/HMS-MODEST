import dotenv from 'dotenv';
dotenv.config(); // This loads the variables immediately

import { GoogleGenerativeAI } from "@google/generative-ai";
import Appointment from "../appointments/appointments.model.js";
import Patient from "../patients/patients.model.js";
import Consultation from "./consultation.model.js";
import Prescription from "./prescription.model.js";
import LabRequest from "./labRequest.model.js";
import RadiologyRequest from "./radiologyRequest.model.js";
import WardRequest from "./wardRequest.model.js";
import PharmacyRequest from "../pharmacy/pharmacy.model.js"; 
import Billing from "../billing/billing.model.js";

const geminiApiKey = process.env.GEMINI_API_KEY;
console.log("Gemini Key Status:", geminiApiKey ? "Loaded" : "MISSING");

if (!geminiApiKey) {
  console.error("Missing GEMINI_API_KEY in environment. Check Backend/.env and server startup.");
}

const genAI = new GoogleGenerativeAI(geminiApiKey || "");

// ==================== APPOINTMENTS ====================

// @desc    Get doctor's today appointments
// @route   GET /api/clinical/appointments
// @access  Doctor
export const getDoctorTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doctorStaffId = req.user.staffId || req.user._id;

    const appointments = await Appointment.find({
      doctor: doctorStaffId,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $in: ["scheduled", "approved"] },
    })
      .populate("patient", "fullName phone email gender bloodGroup dateOfBirth")
      .sort({ appointmentTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor's all appointments
// @route   GET /api/clinical/appointments/all
// @access  Doctor
export const getDoctorAllAppointments = async (req, res) => {
  try {
    const doctorStaffId = req.user.staffId || req.user._id;
    const appointments = await Appointment.find({ doctor: doctorStaffId })
      .populate("patient", "fullName phone email gender bloodGroup")
      .sort({ appointmentDate: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== PATIENT PROFILE ====================

// @desc    Get patient full profile + consultation history
// @route   GET /api/clinical/patients/:id
// @access  Doctor
export const getPatientClinicalProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("assignedDoctor", "fullName department");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const [consultations, prescriptions, labRequests, radiologyRequests, wardRequests] =
      await Promise.all([
        Consultation.find({ patient: req.params.id })
          .populate("doctor", "fullName")
          .sort({ createdAt: -1 }),
        Prescription.find({ patient: req.params.id })
          .populate("doctor", "fullName")
          .sort({ createdAt: -1 }),
        LabRequest.find({ patient: req.params.id })
          .populate("doctor", "fullName")
          .sort({ createdAt: -1 }),
        RadiologyRequest.find({ patient: req.params.id })
          .populate("doctor", "fullName")
          .sort({ createdAt: -1 }),
        WardRequest.find({ patient: req.params.id })
          .populate("doctor", "fullName")
          .sort({ createdAt: -1 }),
      ]);

    res.status(200).json({
      patient,
      consultations,
      prescriptions,
      labRequests,
      radiologyRequests,
      wardRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== AI DIAGNOSIS ====================

// @desc    AI suggests diagnosis based on symptoms
// @route   POST /api/clinical/ai/suggest-diagnosis
// @access  Doctor
export const suggestDiagnosis = async (req, res) => {
  try {
    const { symptoms, patientAge, patientGender, vitals } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required for AI analysis" });
    }

    const prompt = `You are a clinical decision support system. Based on the following patient information, suggest possible diagnoses with ICD-10 codes.

Patient Information:
- Age: ${patientAge || "Unknown"}
- Gender: ${patientGender || "Unknown"}
- Symptoms: ${symptoms}
- Vitals: ${vitals ? JSON.stringify(vitals) : "Not provided"}

Please provide:
1. Top 3 most likely diagnoses
2. ICD-10 code for each diagnosis
3. Brief reasoning for each
4. Recommended immediate investigations

Format your response as a strict JSON object with this exact structure:
{
  "diagnoses": [
    {
      "rank": 1,
      "diagnosis": "name",
      "icd10Code": "code",
      "icd10Description": "description",
      "reasoning": "reasoning",
      "confidence": "high"
    }
  ],
  "recommendedInvestigations": ["test1"],
  "urgencyLevel": "routine",
  "additionalNotes": "notes"
}

Respond ONLY with the JSON object. Do not include markdown code blocks or any other text.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", // Updated to the stable model reference name
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let parsed;
    try {
      const clean = responseText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (parseError) {
      console.error("AI JSON Parse Error:", responseText);
      return res.status(500).json({ message: "AI returned invalid data format" });
    }

    res.status(200).json(parsed);
  } catch (error) {
    console.error("Gemini Controller Error:", error);
    if (error.message.includes("404")) {
      return res.status(404).json({ message: "AI Model not found. Check API key and model name." });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create consultation (WITHOUT 'next' to avoid middleware errors)
// @route   POST /api/clinical/consultations
// @access  Doctor
export const createConsultation = async (req, res) => {
  try {
    if (!req.body.patient) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    // 1. Create the consultation
    const consultation = await Consultation.create({
      ...req.body,
      doctor: req.user.staffId || req.user._id,
    });

    const populated = await consultation.populate([
      { path: "patient", select: "fullName phone gender bloodGroup" },
      { path: "doctor", select: "fullName department" },
    ]);

    // 2. Fire and forget the Billing sync
    // We do NOT use 'await' here so it doesn't hold up the response
    syncBilling(populated, req.body.consultationFee || 500)
      .then(() => console.log("✅ Billing sync completed successfully"))
      .catch((err) => console.error("⚠️ Billing sync background error:", err.message));

    // 3. Return success immediately
    return res.status(201).json({
      message: "Consultation recorded successfully.",
      consultation: populated,
    });

  } catch (error) {
    console.error("🔴 Hard Consultation Failure:", error);
    // Explicitly send the response; do not call next(error)
    return res.status(500).json({ 
      message: "Could not process consultation request.", 
      error: error.message 
    });
  }
};

// Helper function outside the controller to handle the background logic
async function syncBilling(populated, fee) {
  const patientId = populated.patient._id;
  const consultationPayload = {
    consultationId: populated._id,
    fee: Number(fee),
    status: "Pending"
  };

  let activeBill = await Billing.findOne({
    patient: patientId,
    $or: [
      { paymentStatus: { $in: ["Unpaid", "Partially Paid", "pending", "Pending"] } },
      { status: { $in: ["Unpaid", "Partially Paid", "pending", "Pending"] } }
    ]
  });

  if (activeBill) {
    activeBill.consultation = consultationPayload;
    if (activeBill.paymentStatus) activeBill.paymentStatus = "Unpaid";
    if (activeBill.status) activeBill.status = "Unpaid";
    await activeBill.save();
  } else {
    await Billing.create({
      patient: patientId,
      consultation: consultationPayload,
      paymentStatus: "Unpaid",
      status: "Unpaid",
      totalAmountDue: fee
    });
  }
}

// @desc    Get single consultation
// @route   GET /api/clinical/consultations/:id
// @access  Doctor
export const getConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("patient", "fullName phone gender bloodGroup dateOfBirth")
      .populate("doctor", "fullName department");

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    res.status(200).json(consultation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update consultation
// @route   PUT /api/clinical/consultations/:id
// @access  Doctor
export const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )
      .populate("patient", "fullName phone")
      .populate("doctor", "fullName department");

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    res.status(200).json({ message: "Consultation updated", consultation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== ⚡ PRESCRIPTIONS (department sync linked!) ====================

// @desc    Create prescription & sync to pharmacy request workflow queue
// @route   POST /api/clinical/prescriptions
// @access  Doctor
export const createPrescription = async (req, res) => {
  try {
    const doctorId = req.user.staffId || req.user._id;

    // 1. Save standard clinical record history document
    const prescription = await Prescription.create({
      ...req.body,
      doctor: doctorId,
    });

    // 2. Populate clinical instance records cleanly
    const populated = await prescription.populate([
      { path: "patient", select: "fullName phone gender" },
      { path: "doctor", select: "fullName department" },
    ]);

    // 3. 🚀 THE DEPARTMENT BRIDGE: Mirror this order straight into PharmacyRequest!
    if (populated.patient) {
      const mappedMedications = Array.isArray(req.body.medications) 
        ? req.body.medications.map(m => ({
            drugName: m.drugName || m.medicine,
            dosage: m.dosage || 'N/A',
            quantity: parseInt(m.quantity || 1, 10)
          }))
        : [];

      await PharmacyRequest.create({
        patient: {
          fullName: populated.patient.fullName,
          _id: populated.patient._id.toString()
        },
        medications: mappedMedications,
        notes: req.body.notes || 'Prescription issued from consultation dashboard.',
        status: 'pending',
        paymentStatus: 'pending',
        createdBy: doctorId.toString()
      });
      console.log(`Successfully synced prescription to pharmacy workbench for: ${populated.patient.fullName}`);
    }

    res.status(201).json({ message: "Prescription created and sent to Pharmacy", prescription: populated });
  } catch (error) {
    console.error("Prescription generation error:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all pending prescriptions
// @route   GET /api/clinical/prescriptions
// @access  Pharmacist, Doctor, Admin
export const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: "pending" })
      .populate("patient", "fullName phone")
      .populate("doctor", "fullName department")
      .sort({ createdAt: -1 });

    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient prescriptions
// @route   GET /api/clinical/prescriptions/:patientId
// @access  Doctor, Pharmacist
export const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.params.patientId })
      .populate("doctor", "fullName department")
      .populate("dispensedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check drug interactions using Gemini AI
// @route   POST /api/clinical/prescriptions/check-interaction
// @access  Doctor
export const checkDrugInteraction = async (req, res) => {
  try {
    const { medications } = req.body;

    if (!medications || medications.length < 2) {
      return res.status(400).json({ message: "At least 2 medications required for interaction check" });
    }

    const drugList = medications.map((m) => m.drugName).join(", ");

    const prompt = `You are a clinical pharmacology expert. Check for drug interactions between the following medications: ${drugList}

Please provide:
1. Any significant drug interactions
2. Severity level (minor/moderate/major/contraindicated)
3. Clinical effects
4. Management recommendations

Format your response as JSON:
{
  "hasInteractions": true/false,
  "interactions": [
    {
      "drugs": ["drug1", "drug2"],
      "severity": "minor/moderate/major/contraindicated",
      "effect": "description of interaction effect",
      "management": "what to do"
    }
  ],
  "overallSafety": "safe/caution/avoid",
  "summary": "brief overall summary"
}

Respond with JSON only, no additional text or markdown.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const clean = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== ⚡ LAB REQUESTS (WITH AUTOMATED FEES) ====================

const LAB_FEES_MENU = {
  "Blood Test": 200,
  "Urine Test": 200,
  "Stool Test": 200,
  "Malaria Test": 150,       
  "Blood Sugar": 150,        
  "Full Blood Count": 800,   
  "Liver Function Test": 800,
  "Kidney Function Test": 800,
  "Lipid Profile": 800,
  "Culture & Sensitivity": 1200,
  "Thyroid Function": 1200,
  "HIV Test": 0,             
  "Other": 200               
};

// @desc    Create lab request with AUTOMATED pricing sync to Cashier Pool
// @route   POST /api/clinical/lab-requests
// @access  Doctor
// src/modules/clinical/clinical.controller.js

export const createLabRequest = async (req, res) => {
  try {
    const { patient, testName, testType, urgency, clinicalNotes, consultation } = req.body;
    const doctorId = req.user.staffId || req.user._id;

    const automaticallyResolvedCost = LAB_FEES_MENU[testType] !== undefined ? LAB_FEES_MENU[testType] : 200;

    const labRequest = await LabRequest.create({
      patient,
      doctor: doctorId,
      consultation: consultation || null,
      testName,
      testType,
      urgency,
      clinicalNotes,
      testCost: automaticallyResolvedCost,
      status: "pending"
    });

    const populated = await labRequest.populate([
      { path: "patient", select: "fullName phone" },
      { path: "doctor", select: "fullName department" },
    ]);

    // FIXED QUERY: Use 'paymentStatus' instead of 'status' to find the bill
   await Billing.findOneAndUpdate(
  { patient: patient, paymentStatus: { $in: ["Unpaid", "Partially Paid"] } }, 
  {
    $push: {
      labCharges: { 
        labRequestId: populated._id,
        testName: `${testType} (${testName})`,
        cost: automaticallyResolvedCost,
        status: "Pending"
      },
    },
    // Manually increment both the specific counter and the total
    $inc: { 
      totalAmountDue: automaticallyResolvedCost,
      totalAmount: automaticallyResolvedCost // Add this line
    },
  },
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
);

    res.status(201).json({ 
      message: "Lab request ordered and charges synced.", 
      labRequest: populated 
    });
  } catch (error) {
    console.error("🔴 Lab Fee Sync Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all pending lab requests
// @route   GET /api/clinical/lab-requests
// @access  Lab, Doctor, Admin
export const getAllLabRequests = async (req, res) => {
  try {
    const labRequests = await LabRequest.find({
      status: { $in: ["pending", "processing"] },
    })
      .populate("patient", "fullName phone")
      .populate("doctor", "fullName department")
      .sort({ createdAt: -1 });

    res.status(200).json(labRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient lab requests
// @route   GET /api/clinical/lab-requests/:patientId
// @access  Doctor, Lab
export const getPatientLabRequests = async (req, res) => {
  try {
    const labRequests = await LabRequest.find({ patient: req.params.patientId })
      .populate("doctor", "fullName department")
      .populate("processedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(labRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lab request status and result
// @route   PUT /api/clinical/lab-requests/:id/status
// @access  Lab
export const updateLabRequest = async (req, res) => {
  try {
    const { status, result, resultNotes } = req.body;

    const labRequest = await LabRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        result: result || null,
        resultNotes: resultNotes || null,
        resultUploadedAt: status === "completed" ? new Date() : null,
        processedBy: req.user._id,
      },
      { new: true }
    )
      .populate("patient", "fullName")
      .populate("doctor", "fullName");

    if (!labRequest) {
      return res.status(404).json({ message: "Lab request not found" });
    }

    res.status(200).json({ message: "Lab request updated", labRequest });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== RADIOLOGY REQUESTS ====================

// @desc    Create radiology request
// @route   POST /api/clinical/radiology-requests
// @access  Doctor
export const createRadiologyRequest = async (req, res) => {
  try {
    const radiologyRequest = await RadiologyRequest.create({
      ...req.body,
      doctor: req.user.staffId || req.user._id,
    });

    const populated = await radiologyRequest.populate([
      { path: "patient", select: "fullName phone" },
      { path: "doctor", select: "fullName department" },
    ]);

    res.status(201).json({ message: "Radiology request created", radiologyRequest: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all pending radiology requests
// @route   GET /api/clinical/radiology-requests
// @access  Radiology, Doctor, Admin
export const getAllRadiologyRequests = async (req, res) => {
  try {
    const radiologyRequests = await RadiologyRequest.find({
      status: { $in: ["pending", "processing"] },
    })
      .populate("patient", "fullName phone")
      .populate("doctor", "fullName department")
      .sort({ createdAt: -1 });

    res.status(200).json(radiologyRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient radiology requests
// @route   GET /api/clinical/radiology-requests/:patientId
// @access  Doctor, Radiology
export const getPatientRadiologyRequests = async (req, res) => {
  try {
    const radiologyRequests = await RadiologyRequest.find({ patient: req.params.patientId })
      .populate("doctor", "fullName department")
      .populate("reportedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(radiologyRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update radiology request
// @route   PUT /api/clinical/radiology-requests/:id/status
// @access  Radiology
export const updateRadiologyRequest = async (req, res) => {
  try {
    const { status, findings, impression } = req.body;

    const radiologyRequest = await RadiologyRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        findings: findings || null,
        impression: impression || null,
        reportedAt: status === "completed" ? new Date() : null,
        reportedBy: req.user.staffId || req.user._id,
      },
      { new: true }
    )
      .populate("patient", "fullName")
      .populate("doctor", "fullName");

    if (!radiologyRequest) {
      return res.status(404).json({ message: "Radiology request not found" });
    }

    res.status(200).json({ message: "Radiology request updated", radiologyRequest });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== WARD REQUESTS ====================

// @desc    Create ward request
// @route   POST /api/clinical/ward-requests
// @access  Doctor
export const createWardRequest = async (req, res) => {
  try {
    const wardRequest = await WardRequest.create({
      ...req.body,
      doctor: req.user.staffId || req.user._id,
    });

    const populated = await wardRequest.populate([
      { path: "patient", select: "fullName phone" },
      { path: "doctor", select: "fullName department" },
    ]);

    res.status(201).json({ message: "Ward request created", wardRequest: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all pending ward requests
// @route   GET /api/clinical/ward-requests
// @access  Nurse, Doctor, Admin
export const getAllWardRequests = async (req, res) => {
  try {
    const wardRequests = await WardRequest.find({
      status: { $in: ["pending", "admitted"] },
    })
      .populate("patient", "fullName phone gender")
      .populate("doctor", "fullName department")
      .populate("assignedNurse", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(wardRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient ward requests
// @route   GET /api/clinical/ward-requests/:patientId
// @access  Doctor, Nurse
export const getPatientWardRequests = async (req, res) => {
  try {
    const wardRequests = await WardRequest.find({ patient: req.params.patientId })
      .populate("doctor", "fullName department")
      .populate("assignedNurse", "fullName")
      .populate("progressNotes.addedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(wardRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ward request status
// @route   PUT /api/clinical/ward-requests/:id/status
// @access  Nurse
export const updateWardRequest = async (req, res) => {
  try {
    const { status, bedNumber, nurseNotes, progressNote } = req.body;

    const wardRequest = await WardRequest.findById(req.params.id);

    if (!wardRequest) {
      return res.status(404).json({ message: "Ward request not found" });
    }

    wardRequest.status = status || wardRequest.status;
    wardRequest.bedNumber = bedNumber || wardRequest.bedNumber;
    wardRequest.nurseNotes = nurseNotes || wardRequest.nurseNotes;
    wardRequest.assignedNurse = req.user._id;

    if (status === "admitted") wardRequest.admittedAt = new Date();
    if (status === "discharged") wardRequest.dischargedAt = new Date();

    if (progressNote) {
      wardRequest.progressNotes.push({
        note: progressNote,
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }

    await wardRequest.save();

    res.status(200).json({ message: "Ward request updated", wardRequest });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};