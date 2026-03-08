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
    let agentId = req.query.agentId;
    let passengerId = req.query.passengerId;

    // If the logged-in user is an agent, force filter by their ID
    if (req.user && req.user.role_id === "3") {
      agentId = req.user.id;
    }

    const complaints = await ComplaintService.getAllComplaints(
      agentId,
      passengerId,
    );
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
    const { status, resolutionMessage } = req.body;
    const result = await ComplaintService.updateStatus(
      req.params.id,
      status,
      resolutionMessage,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Receive passenger feedback on a resolution.
 */
exports.updateComplaintFeedback = async (req, res, next) => {
  try {
    const { feedback } = req.body;
    const result = await ComplaintService.updateFeedback(
      req.params.id,
      feedback,
    );
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
