const ComplaintService = require("../services/complaintService");

/**
 * Complaint Controller
 * Handles passenger complaints and statistics.
 */

/**
 * Get all complaints with user and bus details.
 */
exports.getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await ComplaintService.getAllComplaints();
    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a new complaint.
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = await ComplaintService.createComplaint(req.body);
    res.status(201).json(complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * Update the status of a complaint (e.g., resolved).
 */
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await ComplaintService.updateStatus(req.params.id, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics of complaints by category.
 */
exports.getComplaintStats = async (req, res, next) => {
  try {
    const stats = await ComplaintService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
