import PharmacyRequest from "./pharmacy.model.js";
import Pharmacy from "./inventory.model.js";

// ======================================================
// @desc    Create new pharmacy request (from Consultation)
// @route   POST /api/v1/pharmacy/requests
// ======================================================
export const createPharmacyRequest = async (req, res) => {
  try {
    const { patient, doctor, consultation, medications } = req.body;

    // Create the request with a default status of "pending"
    const newRequest = await PharmacyRequest.create({
      patient,
      doctor,
      consultation,
      medications,
      status: "pending",
      paymentStatus: "unpaid" // Default until finance clears it
    });

    res.status(201).json({
      success: true,
      message: "Pharmacy request created successfully",
      data: newRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create pharmacy request",
      error: error.message
    });
  }
};

// ======================================================
// @desc    Get all pharmacy requests by status
// @route   GET /api/v1/pharmacy/requests?status=pending
// ======================================================
export const getPharmacyRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const requests = await PharmacyRequest.find(
      status ? { status } : {}
    )
      .populate("patient", "fullName phone gender bloodGroup age")
      .populate("doctor", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pharmacy requests",
      error: error.message,
    });
  }
};

// ======================================================
// @desc    Get single pharmacy request
// @route   GET /api/v1/pharmacy/requests/:id
// ======================================================
export const getPharmacyRequestById = async (req, res) => {
  try {
    const request = await PharmacyRequest.findById(req.params.id)
      .populate("patient")
      .populate("doctor", "fullName");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// @desc    Prepare medication for dispensing (FEFO)
// @route   PUT /api/v1/pharmacy/requests/:id/process
// ======================================================
export const prepareForDispensing = async (req, res) => {
  try {
    const { selectedItems } = req.body;

    const request = await PharmacyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy request not found",
      });
    }

    let totalAmount = 0;
    const billDetails = [];

    for (const item of selectedItems) {
      const medicine = await Pharmacy.findOne({
        itemName: item.name,
      });

      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `${item.name} not found in inventory`,
        });
      }

      if (medicine.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}`,
        });
      }

      // FEFO Sorting
      const sortedBatches = medicine.batches.sort(
        (a, b) =>
          new Date(a.expiryDate) - new Date(b.expiryDate)
      );

      if (!sortedBatches.length) {
        return res.status(400).json({
          success: false,
          message: `No available batches for ${item.name}`,
        });
      }

      const currentPrice = sortedBatches[0].sellingPrice;

      totalAmount += currentPrice * item.quantity;

      billDetails.push({
        medicineId: medicine._id,
        name: item.name,
        quantity: item.quantity,
        price: currentPrice,
      });
    }

    request.status = "awaiting-payment";
    request.totalAmount = totalAmount;
    request.billDetails = billDetails;

    await request.save();

    res.status(200).json({
      success: true,
      message: "Medication prepared successfully",
      totalAmount,
      billDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// @desc    Finalize dispensing after payment
// @route   PUT /api/v1/pharmacy/requests/:id/dispense
// ======================================================
export const dispenseMedication = async (req, res) => {
  try {
    const { pharmacistNotes } = req.body;

    const request = await PharmacyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy request not found",
      });
    }
   // Add this check to prevent the "not iterable" crash
    if (!request.billDetails || !Array.isArray(request.billDetails)) {
      return res.status(400).json({ 
        success: false, 
        message: "No bill details found. Please run the 'process' step again." 
      });
    }

    // Existing payment check (keep this)
    if (request.paymentStatus !== "paid") {
       return res.status(402).json({ success: false, message: "Payment not verified" });
    }
    // Verify payment
    if (request.paymentStatus !== "paid") {
      return res.status(402).json({
        success: false,
        message: "Payment not verified",
      });
    }

    // Deduct inventory using FEFO
    for (const item of request.billDetails) {
      const medicine = await Pharmacy.findById(
        item.medicineId
      );

      if (!medicine) continue;

      let remainingQuantity = item.quantity;

      medicine.batches.sort(
        (a, b) =>
          new Date(a.expiryDate) - new Date(b.expiryDate)
      );

      for (const batch of medicine.batches) {
        if (remainingQuantity <= 0) break;

        const deducted = Math.min(
          batch.quantity,
          remainingQuantity
        );

        batch.quantity -= deducted;
        remainingQuantity -= deducted;
      }

      // Remove empty batches
      medicine.batches = medicine.batches.filter(
        (batch) => batch.quantity > 0
      );

      // Update total stock
      medicine.totalStock = medicine.batches.reduce(
        (total, batch) => total + batch.quantity,
        0
      );

      await medicine.save();
    }

    request.status = "completed";
    request.pharmacistNotes = pharmacistNotes;
    request.dispensedAt = Date.now();
    request.dispensedBy = req.user ? req.user._id : request.doctor;

    await request.save();

    res.status(200).json({
      success: true,
      message: "Medication dispensed successfully",
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Add this to your controller file
export const getInventory = async (req, res) => {
  try {
    // Fetch all items from the inventory collection
    const items = await Pharmacy.find({}).sort({ itemName: 1 });
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message
    });
  }
};

// ======================================================
// @desc    Cancel pharmacy request
// @route   PUT /api/v1/pharmacy/requests/:id/cancel
// ======================================================
export const cancelPharmacyRequest = async (req, res) => {
  try {
    const request = await PharmacyRequest.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// @desc    Get completed pharmacy requests
// @route   GET /api/v1/pharmacy/requests/completed
// ======================================================
export const getCompletedPharmacyRequests = async (
  req,
  res
) => {
  try {
    const requests = await PharmacyRequest.find({
      status: "completed",
    })
      .populate("patient", "fullName")
      .populate("doctor", "fullName")
      .sort({ dispensedAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// @desc    Get patient medication history
// @route   GET /api/v1/pharmacy/patients/:patientId
// ======================================================
export const getPatientMedicationHistory = async (
  req,
  res
) => {
  try {
    const history = await PharmacyRequest.find({
      patient: req.params.patientId,
      status: "completed",
    })
      .populate("doctor", "fullName")
      .sort({ dispensedAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Add new item to inventory
// @route   POST /api/v1/pharmacy/inventory
export const addInventoryItem = async (req, res) => {
  try {
    const { itemName, itemType, sellingPrice, batches, reorderLevel } = req.body;

    // This uses the Pharmacy model (Inventory) we created earlier
    const newItem = await Pharmacy.create({
      itemName,
      itemType,
      sellingPrice,
      batches,
      reorderLevel
    });

    res.status(201).json({
      success: true,
      message: "Inventory item added successfully",
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add inventory item",
      error: error.message
    });
  }
};