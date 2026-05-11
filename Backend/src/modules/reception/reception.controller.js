import Patient from "../patients/patients.model.js";
import Appointment from "../appointments/appointments.model.js";
import Staff from "../staff/staff.model.js";
import Queue from "../queue/queue.model.js";
import Visitor from "../visitors/visitor.model.js";
import { sendAppointmentNotification } from "../../services/mail.service.js";

// ==================== PATIENT MANAGEMENT ====================

// @desc    Register new patient
// @route   POST /api/reception/patients
// @access  Receptionist, Admin
export const registerPatient = async (req, res) => {
  try {
    const patient = await Patient.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populated = await patient.populate("assignedDoctor", "fullName department");

    res.status(201).json({ message: "Patient registered successfully", patient: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Search patients by name, phone, or ID
// @route   GET /api/reception/patients?search=
// @access  Receptionist, Admin
export const searchPatients = async (req, res) => {
  try {
    const { search } = req.query;

    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const patients = await Patient.find(query)
      .populate("assignedDoctor", "fullName department")
      .sort({ createdAt: -1 });

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient profile and appointment history
// @route   GET /api/reception/patients/:id
// @access  Receptionist, Admin
export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("assignedDoctor", "fullName department phone");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Get appointment history
    const appointments = await Appointment.find({ patient: req.params.id })
      .populate("doctor", "fullName department")
      .sort({ appointmentDate: -1 });

    res.status(200).json({ patient, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update patient details
// @route   PUT /api/reception/patients/:id
// @access  Receptionist, Admin
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate("assignedDoctor", "fullName department");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({ message: "Patient updated successfully", patient });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== APPOINTMENT MANAGEMENT ====================

// @desc    Book new appointment
// @route   POST /api/reception/appointments
// @access  Receptionist, Admin
export const bookAppointment = async (req, res) => {
  try {
    const { patient, doctor, appointmentDate, appointmentTime, duration, reason } = req.body;

    // Check doctor availability
    const conflict = await Appointment.findOne({
      doctor,
      appointmentDate,
      appointmentTime,
      status: { $nin: ["cancelled", "rejected", "missed"] },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Doctor is not available at this date and time",
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      duration,
      reason,
      createdBy: req.user._id,
    });

    const populated = await appointment.populate([
      { path: "patient", select: "fullName phone email" },
      { path: "doctor", select: "fullName department email" },
    ]);

    // Notify doctor
    await sendAppointmentNotification({
      to: populated.doctor.email,
      subject: "New Appointment Booked",
      patientName: populated.patient.fullName,
      doctorName: populated.doctor.fullName,
      date: appointmentDate,
      time: appointmentTime,
      reason,
      type: "new",
    });

    // Notify patient
    if (populated.patient.email) {
      await sendAppointmentNotification({
        to: populated.patient.email,
        subject: "Appointment Confirmation",
        patientName: populated.patient.fullName,
        doctorName: populated.doctor.fullName,
        date: appointmentDate,
        time: appointmentTime,
        reason,
        type: "approved",
      });
    }

    res.status(201).json({ message: "Appointment booked successfully", appointment: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get today's appointments
// @route   GET /api/reception/appointments/today
// @access  Receptionist, Admin
export const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      appointmentDate: { $gte: today, $lt: tomorrow },
    })
      .populate("patient", "fullName phone email")
      .populate("doctor", "fullName department")
      .sort({ appointmentTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check doctor availability
// @route   GET /api/reception/doctors/available?date=&time=
// @access  Receptionist, Admin
export const checkDoctorAvailability = async (req, res) => {
  try {
    const { date, time } = req.query;

    const allDoctors = await Staff.find({ role: "doctor" });

    const bookedDoctors = await Appointment.find({
      appointmentDate: date,
      appointmentTime: time,
      status: { $nin: ["cancelled", "rejected", "missed"] },
    }).select("doctor");

    const bookedDoctorIds = bookedDoctors.map((a) => a.doctor.toString());

    const availableDoctors = allDoctors.filter(
      (d) => !bookedDoctorIds.includes(d._id.toString())
    );

    res.status(200).json({ availableDoctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/reception/appointments/:id/reschedule
// @access  Receptionist, Admin
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check new time conflict
    const conflict = await Appointment.findOne({
      doctor: appointment.doctor,
      appointmentDate,
      appointmentTime,
      status: { $nin: ["cancelled", "rejected", "missed"] },
      _id: { $ne: req.params.id },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Doctor is not available at this new date and time",
      });
    }

    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    appointment.status = "scheduled";
    await appointment.save();

    res.status(200).json({ message: "Appointment rescheduled successfully", appointment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== QUEUE MANAGEMENT ====================

// @desc    Check in patient
// @route   POST /api/reception/queue/checkin
// @access  Receptionist, Admin
export const checkInPatient = async (req, res) => {
  try {
    const { patient, appointment, doctor, notes } = req.body;

    // Get next queue number for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await Queue.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const queueEntry = await Queue.create({
      patient,
      appointment: appointment || null,
      doctor: doctor || null,
      queueNumber: todayCount + 1,
      notes,
      createdBy: req.user._id,
    });

    const populated = await queueEntry.populate([
      { path: "patient", select: "fullName phone" },
      { path: "doctor", select: "fullName department" },
    ]);

    res.status(201).json({ message: "Patient checked in", queue: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get today's waiting list
// @route   GET /api/reception/queue
// @access  Receptionist, Admin
export const getQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Queue.find({
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .populate("patient", "fullName phone")
      .populate("doctor", "fullName department")
      .sort({ queueNumber: 1 });

    res.status(200).json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update queue status
// @route   PUT /api/reception/queue/:id/status
// @access  Receptionist, Admin
export const updateQueueStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    queue.status = status;
    if (status === "being_seen") queue.seenAt = new Date();
    if (status === "done") queue.doneAt = new Date();

    await queue.save();

    res.status(200).json({ message: "Queue status updated", queue });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== VISITOR MANAGEMENT ====================

// @desc    Register walk-in visitor
// @route   POST /api/reception/visitors
// @access  Receptionist, Admin
export const registerVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Visitor registered", visitor });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get today's visitors
// @route   GET /api/reception/visitors/today
// @access  Receptionist, Admin
export const getTodayVisitors = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visitors = await Visitor.find({
      visitDate: { $gte: today, $lt: tomorrow },
    })
      .populate("assignedDoctor", "fullName department")
      .sort({ createdAt: -1 });

    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Find visitor by ticket number
// @route   GET /api/reception/visitors/:ticket
// @access  Receptionist, Admin
export const getVisitorByTicket = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ ticketNumber: req.params.ticket })
      .populate("assignedDoctor", "fullName department");

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== REPORTS ====================


// @desc    Update visitor status
// @route   PUT /api/reception/visitors/:id/status
// @access  Receptionist, Admin
export const updateVisitorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    res.status(200).json({ message: "Visitor status updated", visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get daily report
// @route   GET /api/reception/reports/daily
export const getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, appointmentsToday, noShows, visitorsToday, queueToday] =
      await Promise.all([
        Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
        Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }),
        Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow }, status: "missed" }),
        Visitor.countDocuments({ visitDate: { $gte: today, $lt: tomorrow } }),
        Queue.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      ]);

    res.status(200).json({
      period: "Daily",
      date: today.toDateString(),
      totalPatientsRegisteredToday: totalPatients,
      appointmentsToday,
      noShows,
      walkInVisitors: visitorsToday,
      totalCheckedIn: queueToday,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weekly report
// @route   GET /api/reception/reports/weekly
export const getWeeklyReport = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [patients, appointments, visitors, queue] = await Promise.all([
      Patient.find({ createdAt: { $gte: startOfWeek, $lt: endOfWeek } })
        .populate("assignedDoctor", "fullName")
        .select("fullName phone gender bloodGroup assignedDoctor createdAt"),
      Appointment.find({ appointmentDate: { $gte: startOfWeek, $lt: endOfWeek } })
        .populate("patient", "fullName")
        .populate("doctor", "fullName")
        .select("patient doctor appointmentDate appointmentTime status reason"),
      Visitor.find({ visitDate: { $gte: startOfWeek, $lt: endOfWeek } })
        .select("fullName phone gender reason status ticketNumber visitDate"),
      Queue.find({ createdAt: { $gte: startOfWeek, $lt: endOfWeek } })
        .populate("patient", "fullName")
        .select("patient queueNumber status checkedInAt"),
    ]);

    const noShows = appointments.filter(a => a.status === "missed");

    res.status(200).json({
      period: "Weekly",
      date: `${startOfWeek.toDateString()} — ${endOfWeek.toDateString()}`,
      summary: {
        totalPatientsRegistered: patients.length,
        totalAppointments: appointments.length,
        noShows: noShows.length,
        walkInVisitors: visitors.length,
        totalCheckedIn: queue.length,
      },
      patients,
      appointments,
      visitors,
      queue,
      noShowsList: noShows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly report
// @route   GET /api/reception/reports/monthly
export const getMonthlyReport = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [totalPatients, appointmentsCount, noShows, visitorsCount, queueCount] =
      await Promise.all([
        Patient.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
        Appointment.countDocuments({ appointmentDate: { $gte: startOfMonth, $lt: endOfMonth } }),
        Appointment.countDocuments({ appointmentDate: { $gte: startOfMonth, $lt: endOfMonth }, status: "missed" }),
        Visitor.countDocuments({ visitDate: { $gte: startOfMonth, $lt: endOfMonth } }),
        Queue.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      ]);

    res.status(200).json({
      period: "Monthly",
      date: `${startOfMonth.toDateString()} — ${endOfMonth.toDateString()}`,
      totalPatientsRegistered: totalPatients,
      appointments: appointmentsCount,
      noShows,
      walkInVisitors: visitorsCount,
      totalCheckedIn: queueCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get yearly report
// @route   GET /api/reception/reports/yearly
export const getYearlyReport = async (req, res) => {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

    const [totalPatients, appointmentsCount, noShows, visitorsCount, queueCount] =
      await Promise.all([
        Patient.countDocuments({ createdAt: { $gte: startOfYear, $lt: endOfYear } }),
        Appointment.countDocuments({ appointmentDate: { $gte: startOfYear, $lt: endOfYear } }),
        Appointment.countDocuments({ appointmentDate: { $gte: startOfYear, $lt: endOfYear }, status: "missed" }),
        Visitor.countDocuments({ visitDate: { $gte: startOfYear, $lt: endOfYear } }),
        Queue.countDocuments({ createdAt: { $gte: startOfYear, $lt: endOfYear } }),
      ]);

    res.status(200).json({
      period: "Yearly",
      date: `${startOfYear.toDateString()} — ${endOfYear.toDateString()}`,
      totalPatientsRegistered: totalPatients,
      appointments: appointmentsCount,
      noShows,
      walkInVisitors: visitorsCount,
      totalCheckedIn: queueCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};