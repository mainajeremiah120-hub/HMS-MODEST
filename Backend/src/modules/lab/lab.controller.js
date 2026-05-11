import LabRequest from "../clinical/labRequest.model.js";
import { getLabTemplate, calculateFlag } from "../lab/labTemplates.js";

// @desc    Get all pending/processing lab requests
// @route   GET /api/lab/requests
// @access  Lab Technician, Admin
export const getAllLabRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status
      ? { status }
      : { status: { $in: ["pending", "processing"] } };

    const labRequests = await LabRequest.find(filter)
      .populate("patient", "fullName phone gender bloodGroup dateOfBirth")
      .populate("doctor", "fullName department")
      .populate("processedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(labRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lab request with template
// @route   GET /api/lab/requests/:id
// @access  Lab Technician, Admin
export const getLabRequestById = async (req, res) => {
  try {
    const labRequest = await LabRequest.findById(req.params.id)
      .populate("patient", "fullName phone gender bloodGroup dateOfBirth")
      .populate("doctor", "fullName department")
      .populate("processedBy", "fullName");

    if (!labRequest) {
      return res.status(404).json({ message: "Lab request not found" });
    }

    // Load template if no results yet
    const template = getLabTemplate(labRequest.testType);

    res.status(200).json({ labRequest, template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get lab template for a test type
// @route   GET /api/lab/template/:testType
// @access  Lab Technician, Admin
export const getTemplate = async (req, res) => {
  try {
    const testType = decodeURIComponent(req.params.testType);
    const template = getLabTemplate(testType);
    res.status(200).json({ testType, template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark lab request as processing
// @route   PUT /api/lab/requests/:id/process
// @access  Lab Technician, Admin
export const processLabRequest = async (req, res) => {
  try {
    const labRequest = await LabRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "processing",
        processedBy: req.user._id,
      },
      { new: true }
    )
      .populate("patient", "fullName phone")
      .populate("doctor", "fullName department");

    if (!labRequest) {
      return res.status(404).json({ message: "Lab request not found" });
    }

    res.status(200).json({ message: "Lab request marked as processing", labRequest });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Upload lab results
// @route   PUT /api/lab/requests/:id/result
// @access  Lab Technician, Admin
export const uploadLabResult = async (req, res) => {
  try {
    const { results, interpretation, labNotes } = req.body;

    const labRequest = await LabRequest.findById(req.params.id);

    if (!labRequest) {
      return res.status(404).json({ message: "Lab request not found" });
    }

    // Auto calculate flags for each result
    const processedResults = results.map((r) => ({
      ...r,
      flag: r.flag || calculateFlag(r.value, r.referenceRange),
    }));

    labRequest.results = processedResults;
    labRequest.interpretation = interpretation || null;
    labRequest.labNotes = labNotes || null;
    labRequest.status = "completed";
    labRequest.resultUploadedAt = new Date();
    labRequest.processedBy = req.user._id;

    await labRequest.save();

    const populated = await labRequest.populate([
      { path: "patient", select: "fullName phone gender bloodGroup dateOfBirth" },
      { path: "doctor", select: "fullName department" },
      { path: "processedBy", select: "fullName" },
    ]);

    res.status(200).json({ message: "Lab results uploaded successfully", labRequest: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all completed lab requests
// @route   GET /api/lab/requests/completed
// @access  Lab Technician, Admin, Doctor
export const getCompletedLabRequests = async (req, res) => {
  try {
    const labRequests = await LabRequest.find({ status: "completed" })
      .populate("patient", "fullName phone gender")
      .populate("doctor", "fullName department")
      .populate("processedBy", "fullName")
      .sort({ resultUploadedAt: -1 });

    res.status(200).json(labRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient lab history
// @route   GET /api/lab/patients/:patientId
// @access  Lab Technician, Admin, Doctor
export const getPatientLabHistory = async (req, res) => {
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

// @desc    Cancel lab request
// @route   PUT /api/lab/requests/:id/cancel
// @access  Lab Technician, Admin
export const cancelLabRequest = async (req, res) => {
  try {
    const labRequest = await LabRequest.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!labRequest) {
      return res.status(404).json({ message: "Lab request not found" });
    }

    res.status(200).json({ message: "Lab request cancelled", labRequest });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};