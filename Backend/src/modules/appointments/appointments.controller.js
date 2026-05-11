import Appointment from "./appointments.model.js";
import { sendAppointmentNotification } from "../../services/mail.service.js";
// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Admin, Doctor)
export const createAppointment = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      duration,
      reason,
      isRecurring,
      recurringInterval,
      recurringEndDate,
    } = req.body;

    // Check for double booking
    const conflict = await Appointment.findOne({
      doctor,
      appointmentDate,
      appointmentTime,
      status: { $nin: ["cancelled", "rejected", "missed"] },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Doctor already has an appointment at this date and time",
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      duration,
      reason,
      isRecurring,
      recurringInterval,
      recurringEndDate,
      createdBy: req.user._id,
    });

    const populated = await appointment.populate([
      { path: "patient", select: "fullName phone email" },
      { path: "doctor", select: "fullName department email" },
    ]);

    // Notify doctor via email
    await sendAppointmentNotification({
      to: populated.doctor.email,
      subject: "New Appointment Assigned",
      patientName: populated.patient.fullName,
      doctorName: populated.doctor.fullName,
      date: appointmentDate,
      time: appointmentTime,
      reason,
      type: "new",
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Admin sees all, Doctor sees own
export const getAllAppointments = async (req, res) => {
  try {
    const filter = req.user.role === "doctor"
  ? { doctor: req.user.staffId }
  : {};

    const appointments = await Appointment.find(filter)
      .populate("patient", "fullName phone email")
      .populate("doctor", "fullName department")
      .populate("createdBy", "fullName")
      .sort({ appointmentDate: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private (Admin, Doctor)
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "fullName phone email address bloodGroup")
      .populate("doctor", "fullName department phone email")
      .populate("createdBy", "fullName");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (Admin, Doctor)
export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )
      .populate("patient", "fullName phone email")
      .populate("doctor", "fullName department");

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve appointment
// @route   PUT /api/appointments/:id/approve
// @access  Doctor only
export const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "patient",
      "fullName email"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.approvalStatus = "approved";
    appointment.status = "approved";
    await appointment.save();

    // Notify patient
    await sendAppointmentNotification({
      to: appointment.patient.email,
      subject: "Appointment Approved",
      patientName: appointment.patient.fullName,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      type: "approved",
    });

    res.status(200).json({ message: "Appointment approved", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject appointment
// @route   PUT /api/appointments/:id/reject
// @access  Doctor only
export const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "patient",
      "fullName email"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.approvalStatus = "rejected";
    appointment.status = "rejected";
    await appointment.save();

    // Notify patient
    await sendAppointmentNotification({
      to: appointment.patient.email,
      subject: "Appointment Rejected",
      patientName: appointment.patient.fullName,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      type: "rejected",
    });

    res.status(200).json({ message: "Appointment rejected", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Admin, Doctor)
export const cancelAppointment = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id).populate(
      "patient",
      "fullName email"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason || "No reason provided";
    await appointment.save();

    // Notify patient
    await sendAppointmentNotification({
      to: appointment.patient.email,
      subject: "Appointment Cancelled",
      patientName: appointment.patient.fullName,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      reason: cancellationReason,
      type: "cancelled",
    });

    res.status(200).json({ message: "Appointment cancelled", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete appointment
// @route   PUT /api/appointments/:id/complete
// @access  Doctor only
export const completeAppointment = async (req, res) => {
  try {
    const { notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "completed";
    appointment.notes = notes || null;
    await appointment.save();

    res.status(200).json({ message: "Appointment marked as completed", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reassign appointment to different doctor
// @route   PUT /api/appointments/:id/reassign
// @access  Admin only
export const reassignAppointment = async (req, res) => {
  try {
    const { newDoctorId } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check for double booking on new doctor
    const conflict = await Appointment.findOne({
      doctor: newDoctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: { $nin: ["cancelled", "rejected", "missed"] },
    });

    if (conflict) {
      return res.status(400).json({
        message: "New doctor already has an appointment at this date and time",
      });
    }

    appointment.doctor = newDoctorId;
    await appointment.save();

    const updated = await appointment.populate([
      { path: "patient", select: "fullName email" },
      { path: "doctor", select: "fullName department email" },
    ]);

    // Notify new doctor
    await sendAppointmentNotification({
      to: updated.doctor.email,
      subject: "Appointment Reassigned to You",
      patientName: updated.patient.fullName,
      doctorName: updated.doctor.fullName,
      date: updated.appointmentDate,
      time: updated.appointmentTime,
      type: "reassigned",
    });

    res.status(200).json({ message: "Appointment reassigned", appointment: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Admin only
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await appointment.deleteOne();

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
