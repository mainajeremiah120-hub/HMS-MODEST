import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
});

const getEmailBody = ({ type, patientName, doctorName, date, time, reason }) => {
  const formattedDate = new Date(date).toDateString();

  const templates = {
    new: `
      <h2>New Appointment Assigned</h2>
      <p>Dear Dr. ${doctorName},</p>
      <p>A new appointment has been assigned to you.</p>
      <ul>
        <li><strong>Patient:</strong> ${patientName}</li>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
      <p>Please log in to the HMS to approve or reject.</p>
    `,
    approved: `
      <h2>Appointment Approved ✅</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been <strong>approved</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>Please arrive 10 minutes early.</p>
    `,
    rejected: `
      <h2>Appointment Rejected ❌</h2>
      <p>Dear ${patientName},</p>
      <p>Unfortunately your appointment has been <strong>rejected</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>Please contact the hospital to reschedule.</p>
    `,
    cancelled: `
      <h2>Appointment Cancelled</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been <strong>cancelled</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Reason:</strong> ${reason || "Not provided"}</li>
      </ul>
      <p>Please contact the hospital to reschedule.</p>
    `,
    reminder: `
      <h2>Appointment Reminder ⏰</h2>
      <p>Dear ${patientName},</p>
      <p>This is a reminder that you have an appointment <strong>tomorrow</strong>.</p>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>Please arrive 10 minutes early.</p>
    `,
    reassigned: `
      <h2>Appointment Reassigned to You</h2>
      <p>Dear Dr. ${doctorName},</p>
      <p>An appointment has been reassigned to you.</p>
      <ul>
        <li><strong>Patient:</strong> ${patientName}</li>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>Please log in to the HMS to review.</p>
    `,
  };

  return templates[type] || "<p>Appointment update from HMS.</p>";
};

export const sendAppointmentNotification = async ({
  to,
  subject,
  patientName,
  doctorName,
  date,
  time,
  reason,
  type,
}) => {
  try {
    await transporter.sendMail({
      from: `"HMS System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: getEmailBody({ type, patientName, doctorName, date, time, reason }),
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
};
export const sendStaffWelcomeEmail = async ({ to, fullName, role, email, password }) => {
  try {
    await transporter.sendMail({
      from: `"HMS System" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Welcome to HMS — Your Login Credentials",
      html: `
        <h2>Welcome to HMS, ${fullName}! 👋</h2>
        <p>Your account has been created. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Role:</strong> ${role}</li>
        </ul>
        <p>Please login at <a href="http://localhost:5173">HMS Portal</a> and change your password.</p>
        <p><strong>Note:</strong> Please keep your credentials safe.</p>
      `,
    });
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send welcome email:`, error.message);
  }
};