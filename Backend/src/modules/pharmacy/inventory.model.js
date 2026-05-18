import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
    batchNumber: { 
        type: String, 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    sellingPrice: { 
        type: Number, 
        required: true, 
        default: 0 
    }
}, { _id: true });

const InventorySchema = new mongoose.Schema({
    itemName: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    itemType: { 
        type: String, 
        enum: ['medicine', 'supply', 'equipment'], 
        default: 'medicine' 
    },
    sellingPrice: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    reorderLevel: { 
        type: Number, 
        default: 10 
    },
    totalStock: { 
        type: Number, 
        default: 0 
    },
    batches: [BatchSchema]
}, { timestamps: true });

// ✅ FIXED: Removed 'next' to prevent the Mongoose middleware signature runtime crash.
InventorySchema.pre('save', function() {
    this.totalStock = this.batches.reduce((sum, batch) => sum + (parseInt(batch.quantity, 10) || 0), 0);
});

export default mongoose.model('Inventory', InventorySchema);