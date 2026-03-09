const DashboardService = require("../services/dashboardService");

/**
 * Dashboard Controller
 * Aggregates analytical data for the main dashboard
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await DashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Dashboard Stats Error:", error.message);
    next(error);
  }
};
