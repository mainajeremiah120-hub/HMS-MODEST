import mongoose from 'mongoose';

const PharmacyRequestSchema = new mongoose.Schema({
    patient: {
        fullName: { type: String, required: true },
        _id: { type: String } // Keeps tracking flexible for inline objects or string IDs
    },
    medications: [
        {
            drugName: { type: String, required: true },
            medicine: { type: String }, // Fallback alias field to safeguard mismatched requests
            dosage: { type: String, default: 'N/A' },
            quantity: { type: Number, required: true, default: 1
             }
        }
    ],
    notes: { 
        type: String, 
        default: '' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'dispensed', 'cancelled'], 
        default: 'pending' 
    },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'paid'], 
        default: 'pending' 
    },
    createdBy: { 
        type: String, 
        required: true 
    },
    dispensedBy: { 
        type: String 
    },
    dispensedAt: { 
        type: Date 
    }
}, { timestamps: true });

export default mongoose.model('PharmacyRequest', PharmacyRequestSchema);