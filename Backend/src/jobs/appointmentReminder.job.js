import cron from "node-cron";
import Appointment from "../modules/appointments/appointments.model.js";
import { sendAppointmentNotification } from "../services/mail.service.js";

// Runs every day at 8:00 AM to send reminders for tomorrow's appointments
const appointmentReminderJob = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setHours(23, 59, 59, 999);

      // Find approved appointments for tomorrow that haven't had reminders sent
      const appointments = await Appointment.find({
        status: "approved",
        reminderSent: false,
        appointmentDate: { $gte: tomorrow, $lte: dayAfter },
      })
        .populate("patient", "fullName email")
        .populate("doctor", "fullName");

      if (appointments.length === 0) {
        console.log("[CRON] No reminders to send today");
        return;
      }
      const delay = (ms) => new Promise(res => setTimeout(res, ms));

      for (const appointment of appointments) {
        await sendAppointmentNotification({
          to: appointment.patient.email,
          subject: "Appointment Reminder - Tomorrow",
          patientName: appointment.patient.fullName,
          doctorName: appointment.doctor.fullName,
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          type: "reminder",
        });

         await delay(1000);

        // Mark reminder as sent
        appointment.reminderSent = true;
        await appointment.save();
      }

      console.log(`[CRON] Sent ${appointments.length} reminder(s)`);
    } catch (error) {
      console.error("[CRON] Reminder job error:", error.message);
    }
  });

  console.log("[CRON] Appointment reminder job started — runs daily at 8:00 AM");
};

export default appointmentReminderJob;