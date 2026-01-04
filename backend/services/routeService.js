const db = require("../config/db");

/**
 * RouteService
 * Handles all business logic and data access for Routes.
 */
class RouteService {
  /**
   * Get all routes from Firestore ordered by route number.
   * @returns {Promise<Array>} List of routes
   */
  static async getAllRoutes() {
    const snapshot = await db
      .collection("routes")
      .orderBy("route_number")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Create a new route.
   * @param {Object} routeData - The route data
   * @returns {Promise<Object>} Created route with ID
   */
  static async createRoute(routeData) {
    const newRoute = {
      ...routeData,
      distance: parseFloat(routeData.distance) || 0,
      created_at: new Date(),
    };
    const docRef = await db.collection("routes").add(newRoute);
    return { id: docRef.id, ...newRoute };
  }

  /**
   * Update an existing route.
   * @param {string} id - Route ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated data
   */
  static async updateRoute(id, updateData) {
    const data = {
      ...updateData,
      distance: parseFloat(updateData.distance) || 0,
    };
    await db.collection("routes").doc(id).update(data);
    return { id, ...data };
  }

  /**
   * Delete a route.
   * @param {string} id - Route ID
   */
  static async deleteRoute(id) {
    await db.collection("routes").doc(id).delete();
  }
}

module.exports = RouteService;
