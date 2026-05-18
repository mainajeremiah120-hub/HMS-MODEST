import express from 'express';
const router = express.Router();

import { 
    createPharmacyRequest,
    getPharmacyRequestsByStatus, 
    getPharmacyRequestById,
    prepareForDispensing,
    dispenseMedication,
    getInventory,
    cancelPharmacyRequest,
    getCompletedPharmacyRequests,
    getPatientMedicationHistory,
    deleteInventoryItem,
    addInventoryItem,
    deletePharmacyRequest
} from './pharmacy.controller.js'; // 🔗 Clean relative import file lookups

// Core Request & Stock Creations
router.post('/requests', createPharmacyRequest);
router.post('/inventory', addInventoryItem);

// Retrieval Queries
router.get('/requests', getPharmacyRequestsByStatus); 
router.get('/requests/completed', getCompletedPharmacyRequests);
router.get('/requests/:id', getPharmacyRequestById);
router.get('/patients/:patientId', getPatientMedicationHistory);
router.get('/inventory', getInventory);

// Data Modification Pipelines
router.put('/requests/:id/process', prepareForDispensing);
router.put('/requests/:id/dispense', dispenseMedication); 
router.put('/requests/:id/cancel', cancelPharmacyRequest);

// Stock Deletions
router.delete('/inventory/:id', deleteInventoryItem);
router.delete("/requests/:id", deletePharmacyRequest);

export default router;