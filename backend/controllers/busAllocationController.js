const BusAllocationService = require("../services/busAllocationService");

/**
 * Bus Allocation Controller
 */

exports.getAllocations = async (req, res, next) => {
  try {
    const { date, routeId } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ error: "Date parameter is required (YYYY-MM-DD)" });
    }
    const result = await BusAllocationService.getAllocations(date, routeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.overrideAllocation = async (req, res, next) => {
  try {
    const { routeId, date, overrideBuses } = req.body;

    if (!routeId || !date || overrideBuses === undefined) {
      return res
        .status(400)
        .json({ error: "routeId, date, and overrideBuses are required" });
    }

    const result = await BusAllocationService.saveOverride(
      routeId,
      date,
      overrideBuses,
    );
    res.json({
      message: "Allocation override saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentPreview = async (req, res, next) => {
  try {
    const { routeId, neededCount } = req.query;

    if (!routeId || neededCount === undefined) {
      return res
        .status(400)
        .json({ error: "routeId and neededCount are required" });
    }

    const result = await BusAllocationService.getAssignmentPreview(
      routeId,
      parseInt(neededCount),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
