const express = require("express");
const router = express.Router();
const AssignmentController = require("../controllers/assignmentController");
const { protect } = require("../middleware/authMiddleware");

// Apply bulk bus assignments (Admin/Manager only)
router.post("/apply", protect, AssignmentController.applyBulkAssignments);

module.exports = router;
