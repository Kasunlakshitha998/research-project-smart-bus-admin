const express = require("express");
const {
  getAllocations,
  overrideAllocation,
  getAssignmentPreview,
} = require("../controllers/busAllocationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Both admins and managers should be able to see and manage allocations
router.get("/", getAllocations);
router.post(
  "/override",
  protect,
  authorize("manage_allocations"),
  overrideAllocation,
);
router.get(
  "/preview",
  protect,
  authorize("manage_allocations"),
  getAssignmentPreview,
);

module.exports = router;
