const db = require("../config/db");

/**
 * BusService
 * Handles all business logic and data access for Buses using MySQL.
 */
class BusService {
  /**
   * Get all buses with enriched route information.
   */
  static async getAllBuses() {
    const [buses] = await db.execute(`
      SELECT b.*, r.route_number, r.route_name
      FROM buses b
      LEFT JOIN routes r ON b.current_route_id = r.id
      ORDER BY b.license_plate ASC
    `);
    return buses;
  }

  /**
   * Create a new bus.
   */
  static async createBus(busData) {
    const capacity = parseInt(busData.capacity) || 0;
    const status = busData.status || "active";
    const currentRouteId = busData.current_route_id || null;

    const [result] = await db.execute(
      `INSERT INTO buses (license_plate, bus_number, capacity, model, status, driver_id, current_route_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        busData.license_plate || "",
        busData.bus_number || "",
        capacity,
        busData.model || null,
        status,
        busData.driver_id || null,
        currentRouteId,
      ],
    );

    return {
      id: result.insertId,
      ...busData,
      capacity,
      status,
      current_route_id: currentRouteId,
    };
  }

  /**
   * Update an existing bus.
   */
  static async updateBus(id, updateData) {
    const fields = [];
    const values = [];

    const allowed = [
      "license_plate",
      "bus_number",
      "capacity",
      "model",
      "status",
      "driver_id",
      "current_route_id",
    ];
    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(
          key === "capacity" ? parseInt(updateData[key]) || 0 : updateData[key],
        );
      }
    }

    if (fields.length === 0) return { id, ...updateData };

    values.push(id);
    await db.execute(
      `UPDATE buses SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    return { id, ...updateData };
  }

  /**
   * Delete a bus.
   */
  static async deleteBus(id) {
    await db.execute("DELETE FROM buses WHERE id = ?", [id]);
  }
}

module.exports = BusService;
