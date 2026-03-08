const express = require("express");
const {
  getAllComplaints,
  createComplaint,
  updateComplaintStatus,
  getComplaintStats,
  updateComplaintFeedback,
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllComplaints);
router.post("/", createComplaint);
router.patch(
  "/:id/status",
  protect,
  authorize("resolve_complaints"),
  updateComplaintStatus,
);
router.patch("/:id/feedback", updateComplaintFeedback);
router.get("/stats", protect, getComplaintStats);

module.exports = router;
