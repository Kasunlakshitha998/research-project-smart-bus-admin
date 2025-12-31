const RouteService = require("../services/routeService");

/**
 * Route Controller
 * Handles CRUD operations for bus routes.
 */

/**
 * Fetch all available routes.
 */
exports.getAllRoutes = async (req, res, next) => {
  try {
    const routes = await RouteService.getAllRoutes();
    // Frontend expects the array directly
    res.json(routes);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new route.
 */
exports.createRoute = async (req, res, next) => {
  try {
    const route = await RouteService.createRoute(req.body);
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
};

/**
 * Update route details.
 */
exports.updateRoute = async (req, res, next) => {
  try {
    const route = await RouteService.updateRoute(req.params.id, req.body);
    res.json(route);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a route.
 */
exports.deleteRoute = async (req, res, next) => {
  try {
    await RouteService.deleteRoute(req.params.id);
    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    next(error);
  }
};
