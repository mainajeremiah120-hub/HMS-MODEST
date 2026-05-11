import Patient from "./patients.model.js";

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (Admin, Doctor)
const createPatient = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      assignedDoctor,
    } = req.body;

    const patient = await Patient.create({
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      assignedDoctor,
      createdBy: req.user._id,
    });

    const populated = await patient.populate("assignedDoctor", "fullName department");

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin, Doctor)
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("assignedDoctor", "fullName department")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single patient by ID
// @route   GET /api/patients/:id
// @access  Private (Admin, Doctor)
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("assignedDoctor", "fullName department phone")
      .populate("createdBy", "fullName");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Admin, Doctor)
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate("assignedDoctor", "fullName department");

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.deleteOne();

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createPatient, getAllPatients, getPatientById, updatePatient, deletePatient };
