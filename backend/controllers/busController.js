const BusService = require("../services/busService");

/**
 * Bus Controller
 * Handles CRUD operations for buses.
 */

/**
 * Get all buses with their current route info.
 */
exports.getAllBuses = async (req, res, next) => {
  try {
    const buses = await BusService.getAllBuses();
    res.json(buses);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new bus record.
 */
exports.createBus = async (req, res, next) => {
  try {
    const bus = await BusService.createBus(req.body);
    res.status(201).json(bus);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing bus.
 */
exports.updateBus = async (req, res, next) => {
  try {
    const bus = await BusService.updateBus(req.params.id, req.body);
    res.json(bus);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a bus record.
 */
exports.deleteBus = async (req, res, next) => {
  try {
    await BusService.deleteBus(req.params.id);
    res.json({ message: "Bus deleted successfully" });
  } catch (error) {
    next(error);
  }
};
