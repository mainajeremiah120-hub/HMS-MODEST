import cron from "node-cron";
import Appointment from "../modules/appointments/appointments.model.js";

// Runs every hour to check for missed appointments
const appointmentExpiryJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Find all scheduled/approved appointments that are in the past
      const missedAppointments = await Appointment.find({
        status: { $in: ["scheduled", "approved"] },
        appointmentDate: { $lt: now },
      });

      if (missedAppointments.length === 0) return;

      const ids = missedAppointments.map((a) => a._id);

      await Appointment.updateMany(
        { _id: { $in: ids } },
        { $set: { status: "missed" } }
      );

      console.log(`[CRON] Marked ${missedAppointments.length} appointment(s) as missed`);
    } catch (error) {
      console.error("[CRON] Expiry job error:", error.message);
    }
  });

  console.log("[CRON] Appointment expiry job started — runs every hour");
};

export default appointmentExpiryJob;