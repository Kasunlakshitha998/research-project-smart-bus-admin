const express = require("express");
const {
  getAllComplaints,
  createComplaint,
  updateComplaintStatus,
  getComplaintStats,
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllComplaints);
router.post("/", protect, createComplaint);
router.patch(
  "/:id/status",
  protect,
  authorize("resolve_complaints"),
  updateComplaintStatus,
);
router.get("/stats", protect, getComplaintStats);

module.exports = router;
