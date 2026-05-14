import express from 'express';
import { addInventoryItem } from './pharmacy.controller.js';

const router = express.Router();

// Import the correct names from your controller
import { 
    createPharmacyRequest,
    getPharmacyRequestsByStatus, 
    getPharmacyRequestById,
    prepareForDispensing,
    dispenseMedication,
    getInventory,
    cancelPharmacyRequest,
    getCompletedPharmacyRequests,
    getPatientMedicationHistory
} from './pharmacy.controller.js';

// Define the routes
router.post('/requests', createPharmacyRequest);
router.post('/inventory', addInventoryItem);


router.get('/requests', getPharmacyRequestsByStatus); // This replaces getAllPharmacyRequests
router.get('/requests/completed', getCompletedPharmacyRequests);
router.get('/requests/:id', getPharmacyRequestById);
router.get('/patients/:patientId', getPatientMedicationHistory);
router.get("/inventory", getInventory);

router.put('/requests/:id/process', prepareForDispensing);
router.put('/requests/:id/dispense', dispenseMedication);
router.put('/requests/:id/cancel', cancelPharmacyRequest);

export default router;