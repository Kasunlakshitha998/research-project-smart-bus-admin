const db = require("../config/db");

/**
 * RouteService
 * Handles all business logic and data access for Routes using MySQL.
 */
class RouteService {
  /**
   * Get all routes from DB ordered by route number.
   * @returns {Promise<Array>} List of routes
   */
  static async getAllRoutes() {
    const [routes] = await db.execute(
      "SELECT * FROM routes ORDER BY route_number ASC",
    );
    return routes;
  }

  /**
   * Create a new route.
   */
  static async createRoute(routeData) {
    const distance = parseFloat(routeData.distance) || 0;
    const [result] = await db.execute(
      `INSERT INTO routes 
      (route_number, route_name, start_point, end_point, estimated_time, distance, start_time, end_time, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        routeData.route_number || "",
        routeData.route_name || "",
        routeData.start_point || null,
        routeData.end_point || null,
        routeData.estimated_time || null,
        distance,
        routeData.start_time || null,
        routeData.end_time || null,
      ],
    );

    return { id: result.insertId, ...routeData, distance };
  }

  /**
   * Update an existing route.
   */
  static async updateRoute(id, updateData) {
    const distance = parseFloat(updateData.distance) || 0;
    await db.execute(
      `UPDATE routes 
       SET route_number = ?, route_name = ?, start_point = ?, end_point = ?, estimated_time = ?, distance = ?, start_time = ?, end_time = ?
       WHERE id = ?`,
      [
        updateData.route_number || "",
        updateData.route_name || "",
        updateData.start_point || null,
        updateData.end_point || null,
        updateData.estimated_time || null,
        distance,
        updateData.start_time || null,
        updateData.end_time || null,
        id,
      ],
    );
    return { id, ...updateData, distance };
  }

  /**
   * Delete a route.
   */
  static async deleteRoute(id) {
    await db.execute("DELETE FROM routes WHERE id = ?", [id]);
  }
}

module.exports = RouteService;
