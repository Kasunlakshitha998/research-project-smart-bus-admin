const PredictionService = require("../services/predictionService");

class AssignmentController {
  /**
   * Bulk assign buses to routes based on predictions or manager overrides.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async applyBulkAssignments(req, res) {
    try {
      const { assignments } = req.body; // Array of { routeId, count }

      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({ error: "Invalid assignments data" });
      }

      const results = [];
      for (const item of assignments) {
        if (item.count > 0) {
          const assignedBusIds = await PredictionService.assignBuses(
            item.routeId,
            item.count,
          );
          results.push({
            routeId: item.routeId,
            assignedCount: assignedBusIds.length,
            busIds: assignedBusIds,
          });
        }
      }

      res.status(200).json({
        message: "Assignments applied successfully",
        results,
      });
    } catch (error) {
      console.error("Error applying assignments:", error);
      res.status(error.status || 500).json({
        error: error.message || "Failed to apply assignments",
      });
    }
  }
}

module.exports = AssignmentController;
