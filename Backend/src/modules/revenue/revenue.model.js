import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
  {
    billingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Billing", 
      required: true 
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    amount: { 
      type: Number, 
      required: true 
    },
    category: { 
      type: String, 
      enum: ["Consultation", "Lab", "Pharmacy", "Total"], 
      required: true 
    },
    paymentMethod: { 
      type: String,
      enum: ["Cash", "M-Pesa", "Insurance"],
      required: true
    },
    processedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },
    notes: String
  },
  { timestamps: true }
);

revenueSchema.index({ createdAt: -1, category: 1 });
revenueSchema.index({ paymentMethod: 1 });
revenueSchema.index({ patient: 1 });

const Revenue = mongoose.model("Revenue", revenueSchema);
export default Revenue;