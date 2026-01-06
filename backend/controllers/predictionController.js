const PredictionService = require("../services/predictionService");

/**
 * Prediction Controller
 * Handles passenger prediction fetching and bus assignment logic.
 */

/**
 * Get passenger predictions (daily/weekly).
 */
exports.getPredictions = async (req, res, next) => {
  try {
    const { routeId, range, startDate, endDate } = req.query;
    const result = await PredictionService.getPredictions(
      routeId,
      range,
      startDate,
      endDate
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a specific number of buses to a route.
 */
exports.assignBuses = async (req, res, next) => {
  try {
    const { routeId, count } = req.body;
    const busIds = await PredictionService.assignBuses(routeId, count);
    res.json({ message: "Buses assigned successfully", busIds });
  } catch (error) {
    next(error);
  }
};
