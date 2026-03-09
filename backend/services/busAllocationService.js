const admin = require("firebase-admin");
const db = require("../config/db");
const PredictionService = require("./predictionService");

class BusAllocationService {
  /**
   * Parse duration string to minutes (e.g., "1h 20m" -> 80)
   */
  static parseDurationToMinutes(durationStr) {
    if (!durationStr) return 45; // Default 45 mins

    let totalMinutes = 0;
    const hourMatch = durationStr.match(/(\d+)\s*h/);
    const minuteMatch = durationStr.match(/(\d+)\s*m/);

    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);

    // Fallback for simple numeric strings
    if (totalMinutes === 0 && !isNaN(durationStr)) {
      totalMinutes = parseInt(durationStr);
    }

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
   * Advanced Bus Allocation Algorithm
   * Steps:
   * Operating minutes: (end_time - start_time)
   * Trips per bus: floor(operatingMinutes / roundTripTime)
   * Daily capacity per bus: floor(tripsPerBus * (avgFleetCapacity * loadFactor))
   * Suggested buses: ceil(predictedPassengers / dailyBusCapacity)
   */
  static async getFleetMetadata() {
    const snapshot = await db
      .collection("buses")
      .where("status", "==", "active")
      .get();
    let totalCapacity = 0;
    let count = 0;
    snapshot.forEach((doc) => {
      totalCapacity += doc.data().capacity || 52;
      count++;
    });
    return {
      avgCapacity: count > 0 ? totalCapacity / count : 52,
      totalActive: count,
    };
  }

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

    return {
      tripsPerBus,
      dailyBusCapacity,
      suggestedBuses,
    };
  }

  /**
   * Fetch all allocations for a specific date, combining predictions with overrides.
   * Supports optional routeId filtering.
   */
  static async getAllocations(date, routeId = "all") {
    // 0. Get fleet metadata for dynamic capacity
    const { avgCapacity } = await this.getFleetMetadata();

    // 1. Get predictions for all routes for this date
    const predictionResult = await PredictionService.getPredictions(
      routeId,
      "daily",
      date,
      date,
      date,
    );

    // 2. Fetch existing overrides from Firestore for this date
    const overridesSnapshot = await db
      .collection("bus_allocations")
      .where("date", "==", date)
      .get();

    const overridesMap = {};
    overridesSnapshot.forEach((doc) => {
      overridesMap[doc.data().route_id] = doc.data();
    });

    // 3. Combine data
    const allocations = predictionResult.byRoute.map((routeData) => {
      // Find actual route data for operational parameters
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
        date: date,
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
   * Save or update a manager override for a specific route and date.
   */
  static async saveOverride(routeId, date, overrideBuses) {
    // 1. Get predicted population for this route and date to store in the record
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

    const allocationRef = db
      .collection("bus_allocations")
      .where("route_id", "==", routeId)
      .where("date", "==", date)
      .limit(1);

    const snapshot = await allocationRef.get();

    const allocationData = {
      route_id: routeId,
      date: date,
      predicted_passengers: predictedPassengers,
      trips_per_bus: calcResult.tripsPerBus,
      daily_bus_capacity: calcResult.dailyBusCapacity,
      suggested_buses: calcResult.suggestedBuses,
      manager_override_buses: overrideBuses,
      final_buses:
        overrideBuses !== null ? overrideBuses : calcResult.suggestedBuses,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (snapshot.empty) {
      allocationData.created_at = admin.firestore.FieldValue.serverTimestamp();
      await db.collection("bus_allocations").add(allocationData);
    } else {
      await db
        .collection("bus_allocations")
        .doc(snapshot.docs[0].id)
        .update(allocationData);
    }

    return allocationData;
  }

  /**
   * Get specific buses to satisfy an allocation gap
   */
  static async getAssignmentPreview(routeId, neededCount) {
    if (neededCount <= 0)
      return { buses: [], summary: {}, totalCapacity: 0, isEnough: true };

    const busSnapshot = await db
      .collection("buses")
      .where("status", "==", "active")
      .get();

    const available = [];
    busSnapshot.forEach((doc) => {
      const data = doc.data();
      // Only buses not currently assigned
      if (
        !data.current_route_id ||
        data.current_route_id === "0" ||
        data.current_route_id === 0
      ) {
        available.push({
          id: doc.id,
          license_plate: data.license_plate,
          capacity: data.capacity || 52,
          model: data.model || "Standard",
        });
      }
    });

    // Sort by capacity descending to pick most efficient first?
    // Or just pick first N. Let's sort by capacity desc.
    available.sort((a, b) => b.capacity - a.capacity);

    // Pick top N available
    const selection = available.slice(0, neededCount);

    // Group by capacity for summary
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
