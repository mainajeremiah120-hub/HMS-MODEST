import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    batchNumber: { 
        type: String, 
        required: true 
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    sellingPrice: { 
        type: Number, 
        required: true 
    }
});

const inventorySchema = new mongoose.Schema({
    itemName: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    itemType: { 
        type: String, 
        required: true 
    },
    totalStock: { 
        type: Number, 
        default: 0 
    },
    batches: [batchSchema], // Array of batches for FEFO sorting
    reorderLevel: { 
        type: Number, 
        default: 10 
    }
}, { timestamps: true });

// Middleware to keep totalStock updated automatically
inventorySchema.pre('save', function() {
  // Check if batches exist and have length
  if (this.batches && this.batches.length > 0) {
    this.totalStock = this.batches.reduce((total, batch) => {
      return total + (Number(batch.quantity) || 0);
    }, 0);
  } else {
    this.totalStock = 0;
  }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;