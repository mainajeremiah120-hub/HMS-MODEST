import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason for visit is required"],
    },
    ticketNumber: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ["waiting", "being_seen", "done"],
      default: "waiting",
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true }
);

// Auto generate ticket number before saving
visitorSchema.pre("save", async function () {
  if (!this.ticketNumber) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const count = await mongoose.model("Visitor").countDocuments();
    this.ticketNumber = `VIS-${dateStr}-${String(count + 1).padStart(3, "0")}`;
  }
});

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;