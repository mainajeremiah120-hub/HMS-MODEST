import PharmacyRequest from './pharmacy.model.js'; 
import Inventory from './inventory.model.js'; 
import Billing from '../billing/billing.model.js';

// ==================== 💊 INVENTORY MANAGEMENT ====================

export const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find({}).sort({ itemName: 1 });
        return res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve inventory: " + error.message });
    }
};

export const addInventoryItem = async (req, res) => {
    try {
        const { itemName, itemType, sellingPrice, reorderLevel, batches } = req.body;
        if (!itemName) return res.status(400).json({ message: "Drug name is required" });

        let drug = await Inventory.findOne({ itemName: new RegExp(`^${itemName}$`, 'i') });

        if (drug) {
            if (batches && batches.length > 0) drug.batches.push(...batches);
            if (sellingPrice) drug.sellingPrice = sellingPrice;
        } else {
            drug = new Inventory({
                itemName,
                itemType: itemType || 'medicine',
                sellingPrice: sellingPrice || batches?.[0]?.sellingPrice || 0,
                reorderLevel: reorderLevel || 10,
                batches: batches || []
            });
        }
        await drug.save();
        return res.status(201).json({ success: true, data: drug });
    } catch (error) {
        return res.status(500).json({ message: "Failed to save inventory: " + error.message });
    }
};

export const deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await Inventory.findByIdAndDelete(id);
        if (!deletedItem) return res.status(404).json({ message: "Inventory item not found" });
        return res.status(200).json({ message: "Item successfully removed from stock inventory." });
    } catch (error) {
        return res.status(500).json({ message: "Delete operation failed: " + error.message });
    }
};

// ==================== 📋 QUEUE WORKFLOWS ====================

export const createPharmacyRequest = async (req, res) => {
    try {
        const { patient, medications, notes, createdBy } = req.body;
        const newRequest = new PharmacyRequest({
            patient, medications, notes, createdBy,
            status: 'pending',
            paymentStatus: 'pending'
        });
        await newRequest.save();
        return res.status(201).json(newRequest);
    } catch (error) {
        return res.status(500).json({ message: "Failed to issue prescription request: " + error.message });
    }
};

export const getPharmacyRequestsByStatus = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const requests = await PharmacyRequest.find(filter).sort({ createdAt: -1 });
        return res.status(200).json(requests);
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve queue: " + error.message });
    }
};

export const getCompletedPharmacyRequests = async (req, res) => {
    try {
        const completed = await PharmacyRequest.find({ status: 'dispensed' }).sort({ dispensedAt: -1 });
        return res.status(200).json({ success: true, count: completed.length, data: completed });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to retrieve history: " + error.message });
    }
};

export const getPharmacyRequestById = async (req, res) => {
    try {
        const request = await PharmacyRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        return res.status(200).json(request);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getPatientMedicationHistory = async (req, res) => {
    try {
        const history = await PharmacyRequest.find({ "patient._id": req.params.patientId, status: "dispensed" });
        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const prepareForDispensing = async (req, res) => {
    try {
        const request = await PharmacyRequest.findByIdAndUpdate(req.params.id, { status: 'processing' }, { new: true });
        return res.status(200).json(request);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const cancelPharmacyRequest = async (req, res) => {
    try {
        const request = await PharmacyRequest.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        return res.status(200).json(request);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deletePharmacyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRequest = await PharmacyRequest.findByIdAndDelete(id); 
        if (!deletedRequest) return res.status(404).json({ success: false, message: "Prescription not found." });
        return res.status(200).json({ success: true, message: "Prescription successfully removed." });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== ⚡ THE FEFO DISPENSING MECHANISM ====================
export const dispenseMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const { dispensedBy } = req.body;

        const pharmacyRequest = await PharmacyRequest.findById(id);
        if (!pharmacyRequest) return res.status(404).json({ message: "Prescription order request not found." });

        if (pharmacyRequest.paymentStatus !== 'completed' && pharmacyRequest.paymentStatus !== 'paid') {
            pharmacyRequest.paymentStatus = 'completed';
        }

        for (const med of pharmacyRequest.medications) {
            const TargetDrugName = med.drugName || med.medicine;
            const inventoryItem = await Inventory.findOne({ itemName: new RegExp(`^${TargetDrugName}$`, 'i') });
            
            if (!inventoryItem) return res.status(400).json({ message: `Aborted. "${TargetDrugName}" is missing.` });

            med.price = inventoryItem.sellingPrice || 0;

            inventoryItem.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            let requiredQty = parseInt(med.quantity || 1, 10);

            for (const batch of inventoryItem.batches) {
                if (requiredQty <= 0) break;
                if (batch.quantity <= 0) continue;

                if (batch.quantity >= requiredQty) {
                    batch.quantity -= requiredQty;
                    requiredQty = 0;
                } else {
                    requiredQty -= batch.quantity;
                    batch.quantity = 0;
                }
            }

            if (requiredQty > 0) return res.status(400).json({ message: `Insufficient stock for ${inventoryItem.itemName}.` });

            await inventoryItem.save();
        }

        pharmacyRequest.status = 'dispensed';
        pharmacyRequest.dispensedBy = dispensedBy;
        pharmacyRequest.dispensedAt = new Date();
        await pharmacyRequest.save();

        const mappedPharmacyCharges = pharmacyRequest.medications.map(med => ({
            prescriptionId: pharmacyRequest._id,
            drugName: med.medicine || med.drugName,
            quantity: med.quantity,
            cost: med.price,
            status: 'Pending'
        }));

        let activeBill = await Billing.findOne({
            patient: pharmacyRequest.patient._id,
            paymentStatus: { $in: ["Unpaid", "Partially Paid"] }
        });

        if (activeBill) {
            // Consolidation: append to existing active unpaid bill
            activeBill.pharmacyCharges.push(...mappedPharmacyCharges);
            await activeBill.save();
            console.log(`Synced pharmacy charges to existing active bill for patient: ${pharmacyRequest.patient.fullName}`);
        } else {
            // Create a new billing record if none exists
            const totalAmount = pharmacyRequest.medications.reduce((sum, med) => sum + (med.price * med.quantity), 0);
            const pharmacyBill = new Billing({
                patient: pharmacyRequest.patient._id,
                pharmacyCharges: mappedPharmacyCharges,
                paymentStatus: 'Unpaid',
                paymentMethod: 'Cash',
                totalAmount: totalAmount
            });
            await pharmacyBill.save();
            console.log(`Created new billing record for patient: ${pharmacyRequest.patient.fullName}`);
        }

        return res.status(200).json({ message: "Prescription successfully dispensed!", data: pharmacyRequest });
    } catch (error) {
        console.error("Dispense engine error:", error);
        return res.status(500).json({ message: "Dispensing failed: " + error.message });
    }
};