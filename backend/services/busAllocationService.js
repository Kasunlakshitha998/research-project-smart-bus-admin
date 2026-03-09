const db = require("../config/db");
const PredictionService = require("./predictionService");

class BusAllocationService {
  /**
   * Parse duration string to minutes (e.g., "1h 20m" -> 80)
   */
  static parseDurationToMinutes(durationStr) {
    if (!durationStr) return 45;
    let totalMinutes = 0;
    const hourMatch = durationStr.match(/(\d+)\s*h/);
    const minuteMatch = durationStr.match(/(\d+)\s*m/);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
    if (totalMinutes === 0 && !isNaN(durationStr))
      totalMinutes = parseInt(durationStr);
    return totalMinutes || 45;
  }

  /**
   * Calculate operating minutes from start/end time strings
   */
  static calculateOperatingMinutes(startTime = "06:00", endTime = "22:00") {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  }

  /**
   * Get average fleet capacity from active buses.
   */
  static async getFleetMetadata() {
    const [rows] = await db.execute(
      "SELECT COUNT(*) as count, COALESCE(AVG(capacity), 52) as avgCapacity FROM buses WHERE status = 'active'",
    );
    return {
      avgCapacity: rows[0].avgCapacity || 52,
      totalActive: rows[0].count,
    };
  }

  /**
   * Advanced Bus Allocation Algorithm
   */
  static calculateAdvancedAllocation(
    routeData,
    predictedPassengers,
    avgCapacity = 52,
  ) {
    const travelTime = this.parseDurationToMinutes(routeData.estimated_time);
    const terminalWaitTime = 20;
    const roundTripTime = travelTime * 2 + terminalWaitTime;
    const operatingMinutes = this.calculateOperatingMinutes(
      routeData.start_time || "06:00",
      routeData.end_time || "22:00",
    );
    const tripsPerBus = Math.floor(operatingMinutes / roundTripTime) || 1;
    const busCapacity = avgCapacity;
    const loadFactor = 0.75;
    const effectiveCapacityPerTrip = busCapacity * loadFactor;
    const dailyBusCapacity = Math.floor(tripsPerBus * effectiveCapacityPerTrip);
    const suggestedBuses = Math.ceil(predictedPassengers / dailyBusCapacity);
    return { tripsPerBus, dailyBusCapacity, suggestedBuses };
  }

  /**
   * Fetch all allocations for a specific date, combining predictions with overrides.
   */
  static async getAllocations(date, routeId = "all") {
    const { avgCapacity } = await this.getFleetMetadata();

    const predictionResult = await PredictionService.getPredictions(
      routeId,
      "daily",
      date,
      date,
      date,
    );

    // Fetch existing overrides from DB for this date
    const [overrideRows] = await db.execute(
      "SELECT * FROM bus_allocations WHERE date = ?",
      [date],
    );
    const overridesMap = {};
    overrideRows.forEach((row) => {
      overridesMap[row.route_id] = row;
    });

    const allocations = predictionResult.byRoute.map((routeData) => {
      const fullRouteInfo =
        predictionResult.routes.find((r) => r.id === routeData.id) || {};
      const calcResult = this.calculateAdvancedAllocation(
        fullRouteInfo,
        routeData.prediction,
        avgCapacity,
      );
      const overrideData = overridesMap[routeData.id] || null;
      const overrideBuses = overrideData
        ? overrideData.manager_override_buses
        : null;

      return {
        routeId: routeData.id,
        routeNumber: routeData.route_number,
        routeName: routeData.name,
        date,
        predictedPassengers: routeData.prediction,
        tripsPerBus: calcResult.tripsPerBus,
        dailyBusCapacity: calcResult.dailyBusCapacity,
        suggestedBuses: calcResult.suggestedBuses,
        currentBuses: routeData.current_buses || 0,
        neededBuses: routeData.needed_buses || 0,
        gap: Math.max(
          0,
          calcResult.suggestedBuses - (routeData.current_buses || 0),
        ),
        managerOverride: overrideBuses,
        finalBuses:
          overrideBuses !== null ? overrideBuses : calcResult.suggestedBuses,
        updatedAt: overrideData ? overrideData.updated_at : null,
      };
    });

    return allocations;
  }

  /**
   * Save or update a manager override for a specific route and date using upsert.
   */
  static async saveOverride(routeId, date, overrideBuses) {
    const predictionResult = await PredictionService.getPredictions(
      routeId,
      "daily",
      date,
      date,
      date,
    );

    const routeData = predictionResult.byRoute[0];
    const fullRouteInfo =
      predictionResult.routes.find((r) => r.id === routeId) || {};
    const predictedPassengers = routeData?.prediction || 0;
    const { avgCapacity } = await this.getFleetMetadata();
    const calcResult = this.calculateAdvancedAllocation(
      fullRouteInfo,
      predictedPassengers,
      avgCapacity,
    );

    const finalBuses =
      overrideBuses !== null ? overrideBuses : calcResult.suggestedBuses;

    // Upsert: check if record exists
    const [existing] = await db.execute(
      "SELECT id FROM bus_allocations WHERE route_id = ? AND date = ?",
      [routeId, date],
    );

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO bus_allocations 
         (route_id, date, predicted_passengers, trips_per_bus, daily_bus_capacity, suggested_buses, manager_override_buses, final_buses, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          routeId,
          date,
          predictedPassengers,
          calcResult.tripsPerBus,
          calcResult.dailyBusCapacity,
          calcResult.suggestedBuses,
          overrideBuses,
          finalBuses,
        ],
      );
    } else {
      await db.execute(
        `UPDATE bus_allocations 
         SET predicted_passengers = ?, trips_per_bus = ?, daily_bus_capacity = ?, 
             suggested_buses = ?, manager_override_buses = ?, final_buses = ?, updated_at = NOW()
         WHERE route_id = ? AND date = ?`,
        [
          predictedPassengers,
          calcResult.tripsPerBus,
          calcResult.dailyBusCapacity,
          calcResult.suggestedBuses,
          overrideBuses,
          finalBuses,
          routeId,
          date,
        ],
      );
    }

    return {
      route_id: routeId,
      date,
      predicted_passengers: predictedPassengers,
      trips_per_bus: calcResult.tripsPerBus,
      daily_bus_capacity: calcResult.dailyBusCapacity,
      suggested_buses: calcResult.suggestedBuses,
      manager_override_buses: overrideBuses,
      final_buses: finalBuses,
    };
  }

  /**
   * Get specific buses to satisfy an allocation gap.
   */
  static async getAssignmentPreview(routeId, neededCount) {
    if (neededCount <= 0)
      return { buses: [], summary: {}, totalCapacity: 0, isEnough: true };

    const [available] = await db.execute(
      `SELECT id, license_plate, capacity, model 
       FROM buses 
       WHERE status = 'active' AND (current_route_id IS NULL OR current_route_id = 0)
       ORDER BY capacity DESC`,
    );

    const selection = available.slice(0, neededCount).map((b) => ({
      id: b.id,
      license_plate: b.license_plate,
      capacity: b.capacity || 52,
      model: b.model || "Standard",
    }));

    const summary = selection.reduce((acc, bus) => {
      acc[bus.capacity] = (acc[bus.capacity] || 0) + 1;
      return acc;
    }, {});

    return {
      buses: selection,
      summary,
      totalCapacity: selection.reduce((sum, b) => sum + b.capacity, 0),
      isEnough: selection.length >= neededCount,
      availableCount: available.length,
    };
  }
}

module.exports = BusAllocationService;
