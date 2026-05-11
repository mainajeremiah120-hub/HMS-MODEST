import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    role: Object.assign({
      type: String,
      required: true
    }, { enum: ["admin", "doctor", "nurse", "receptionist"] }),
    department: {
      type: String,
      required: true,
      enum: [ "Administration","reception","Clinical Consultation", "Ward", "Pharmacy", "Laboratory", "Radiology", "cashier"]
    },
    phone: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Staff", staffSchema);