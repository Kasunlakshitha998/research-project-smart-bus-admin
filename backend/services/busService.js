const db = require("../config/db");

/**
 * BusService
 * Handles all business logic and data access for Buses.
 */
class BusService {
  /**
   * Get all buses with enriched route information.
   * @returns {Promise<Array>} List of enriched buses
   */
  static async getAllBuses() {
    const busSnapshot = await db
      .collection("buses")
      .orderBy("license_plate")
      .get();
    const buses = busSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const routeIds = [
      ...new Set(
        buses.filter((b) => b.current_route_id).map((b) => b.current_route_id),
      ),
    ];

    if (routeIds.length > 0) {
      const routeSnapshot = await db.collection("routes").get();
      const routeMap = {};
      routeSnapshot.forEach((doc) => (routeMap[doc.id] = doc.data()));

      buses.forEach((bus) => {
        if (bus.current_route_id && routeMap[bus.current_route_id]) {
          bus.route_number = routeMap[bus.current_route_id].route_number;
          bus.route_name = routeMap[bus.current_route_id].route_name;
        }
      });
    }
    return buses;
  }

  /**
   * Create a new bus.
   * @param {Object} busData - Bus data
   * @returns {Promise<Object>} Created bus
   */
  static async createBus(busData) {
    const newBus = {
      ...busData,
      capacity: parseInt(busData.capacity) || 0,
      status: busData.status || "active",
      current_route_id: busData.current_route_id || null,
      created_at: new Date(),
    };
    const docRef = await db.collection("buses").add(newBus);
    return { id: docRef.id, ...newBus };
  }

  /**
   * Update an existing bus.
   * @param {string} id - Bus ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated bus
   */
  static async updateBus(id, updateData) {
    const data = { ...updateData };

    if (updateData.capacity !== undefined) {
      data.capacity = parseInt(updateData.capacity) || 0;
    }

    await db.collection("buses").doc(id).update(data);
    return { id, ...data };
  }

  /**
   * Delete a bus.
   * @param {string} id - Bus ID
   */
  static async deleteBus(id) {
    await db.collection("buses").doc(id).delete();
  }
}

module.exports = BusService;
