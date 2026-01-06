const db = require("../config/db");
const axios = require("axios");

class PredictionService {
  static getFeaturesForRouteDate(route, dateObj, routeHistoryMap) {
    const d = new Date(dateObj);
    const dayOfWeek = d.getDay();
    const month = d.getMonth() + 1;
    const dayOfMonth = d.getDate();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekOfYear = Math.ceil(
      ((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const diff = d - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

    const hMap = routeHistoryMap[route.id] || {};

    const getLag = (days) => {
      const ld = new Date(d);
      ld.setDate(ld.getDate() - days);
      const ldStr = ld.toISOString().split("T")[0];
      return hMap[ldStr] || 0;
    };

    const lags = [1, 2, 3, 7, 14].map((l) => getLag(l));

    let sum7 = 0;
    let vals7 = [];
    for (let i = 1; i <= 7; i++) {
      const v = getLag(i);
      sum7 += v;
      vals7.push(v);
    }
    const mean7 = sum7 / 7;
    const std7 = Math.sqrt(
      vals7.reduce((acc, v) => acc + Math.pow(v - mean7, 2), 0) / 7
    );

    return {
      Route_ID: route.route_number,
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      week_of_year: weekOfYear,
      month: month,
      day_of_month: dayOfMonth,
      day_of_year: dayOfYear,
      is_holiday: 0,
      lag_1: lags[0],
      lag_2: lags[1],
      lag_3: lags[2],
      lag_7: lags[3],
      lag_14: lags[4],
      rolling_mean_7: mean7,
      rolling_std_7: std7,
    };
  }

  static async getPredictions(
    routeId,
    range = "daily",
    customStartDate = null,
    customEndDate = null
  ) {
    const pythonApiUrl = process.env.PYTHON_API_URL || "http://localhost:5001";

    // 1. Get routes
    const routes = [];
    if (routeId && routeId !== "all") {
      const doc = await db.collection("routes").doc(routeId).get();
      if (doc.exists) routes.push({ id: doc.id, ...doc.data() });
    } else {
      const snapshot = await db.collection("routes").get();
      snapshot.forEach((doc) => routes.push({ id: doc.id, ...doc.data() }));
    }

    if (routes.length === 0)
      return {
        chartData: [],
        byRoute: [],
        totalPredicted: 0,
        accuracy: "0%",
        stats: {},
      };

    // 2. Get bus capacity
    const busSnapshot = await db
      .collection("buses")
      .where("status", "==", "active")
      .get();
    const busCountMap = {};
    busSnapshot.forEach((doc) => {
      const b = doc.data();
      if (b.current_route_id) {
        if (!busCountMap[b.current_route_id])
          busCountMap[b.current_route_id] = { count: 0, capacity: 0 };
        busCountMap[b.current_route_id].count++;
        busCountMap[b.current_route_id].capacity += parseInt(b.capacity) || 0;
      }
    });

    // 3. Historical Data Setup
    const today = new Date();
    // Determine lookback period based on request or default
    let lookbackDays = 30; // Default
    if (range === "monthly") lookbackDays = 365;
    else if (range === "weekly") lookbackDays = 90;

    const historyStartDate = new Date();
    historyStartDate.setDate(today.getDate() - lookbackDays);
    const historyStartDateStr = historyStartDate.toISOString().split("T")[0];

    // Fetch History
    const historySnapshot = await db
      .collection("trip_history")
      .where("trip_date", ">=", historyStartDateStr)
      .orderBy("trip_date", "asc")
      .get();

    const routeHistoryMap = {};
    let totalHistoricalPassengers = 0;
    let historicalDaysCount = 0;

    historySnapshot.forEach((doc) => {
      const h = doc.data();
      if (!routeHistoryMap[h.route_id]) routeHistoryMap[h.route_id] = {};
      routeHistoryMap[h.route_id][h.trip_date] = h.passenger_count;
      if (h.trip_date >= historyStartDateStr) {
        totalHistoricalPassengers += h.passenger_count;
        historicalDaysCount++;
      }
    });

    // 4. Prediction Date Range Setup
    const predictionDates = [];

    if (range === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      // Limit custom range to avoid overload (e.g., max 90 days)
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 90) throw new Error("Custom range cannot exceed 90 days.");

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        predictionDates.push(new Date(d));
      }
    } else {
      // Default ranges
      let predictionPoints = 7;
      if (range === "weekly") predictionPoints = 28; // 4 weeks
      if (range === "monthly") predictionPoints = 90; // 3 months

      for (let i = 0; i < predictionPoints; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        predictionDates.push(d);
      }
    }

    if (predictionDates.length === 0)
      return {
        chartData: [],
        byRoute: [],
        totalPredicted: 0,
        accuracy: "0%",
        stats: {},
      };

    // 5. Recursive Prediction Loop
    const allApiResults = [];
    for (const d of predictionDates) {
      const dStr = d.toISOString().split("T")[0];
      const dailyFeatures = routes.map((route) =>
        this.getFeaturesForRouteDate(route, d, routeHistoryMap)
      );

      try {
        const dailyPredictions = await this.callPythonApi(
          pythonApiUrl,
          dailyFeatures
        );

        // Update routeHistoryMap with new predictions for future lags
        routes.forEach((route, idx) => {
          if (!routeHistoryMap[route.id]) routeHistoryMap[route.id] = {};
          // Guard against potentially missing results
          const val =
            dailyPredictions && dailyPredictions[idx] !== undefined
              ? dailyPredictions[idx]
              : 0;
          routeHistoryMap[route.id][dStr] = val;
          allApiResults.push(val);
        });
      } catch (error) {
        console.error(`Prediction Error for ${dStr}:`, error.message);
        // Fallback: push zeros to maintain consistent array structure
        routes.forEach(() => allApiResults.push(0));
      }
    }

    const apiResults = allApiResults;

    if (!apiResults || apiResults.length === 0) {
      return {
        chartData: [],
        byRoute: [],
        totalPredicted: 0,
        accuracy: "0%",
        stats: { error: "No prediction data returned." },
      };
    }

    // 7. Aggregate Data for Chart
    const chartData = [];

    let contextDays = 7; // Default daily
    if (range === "weekly") contextDays = 14; // 2 weeks actual
    if (range === "monthly") contextDays = 30; // 1 month actual

    for (let i = contextDays; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      let count =
        routeId === "all"
          ? routes.reduce(
              (sum, r) => sum + (routeHistoryMap[r.id]?.[dStr] || 0),
              0
            )
          : routeHistoryMap[routeId]?.[dStr] || 0;

      if (count > 0) {
        chartData.push({ name: dStr, date: dStr, count, type: "actual" });
      }
    }

    let totalPredictedVol = 0;
    let maxPred = 0;
    let maxPredDate = "";

    predictionDates.forEach((d, i) => {
      const dStr = d.toISOString().split("T")[0];
      let count = 0;
      if (routeId === "all") {
        for (let j = 0; j < routes.length; j++)
          count += apiResults[i * routes.length + j];
      } else {
        const idx = routes.findIndex((r) => r.id === routeId);
        count = apiResults[i * routes.length + idx];
      }

      count = Math.max(0, Math.round(count));
      chartData.push({ name: dStr, date: dStr, count, type: "predicted" });

      totalPredictedVol += count;
      if (count > maxPred) {
        maxPred = count;
        maxPredDate = dStr;
      }
    });

    // Aggregation Logic (Weekly/Monthly Sums)
    let finalChartData = chartData;

    if (range === "monthly") {
      const aggMap = new Map();
      chartData.forEach((item) => {
        // Key by Month (YYYY-MM)
        const d = new Date(item.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        // Use first day of month as date for visualization/sorting
        const dateStr = `${key}-01`;

        if (!aggMap.has(key)) {
          aggMap.set(key, {
            name: dateStr,
            date: dateStr,
            count: 0,
            type: item.type,
          });
        }
        const entry = aggMap.get(key);
        entry.count += item.count;
        const typeKey = key + item.type;
        if (!aggMap.has(typeKey)) {
          aggMap.set(typeKey, {
            ...item,
            date: dateStr,
          });
        } else {
          aggMap.get(typeKey).count += item.count;
        }
      });

      finalChartData = Array.from(aggMap.values());
    } else if (range === "weekly") {
      const aggMap = new Map();
      chartData.forEach((item) => {
        const d = new Date(item.date);
        const day = d.getDay();
        const diff = d.getDate() - day; // adjust when day is sunday
        const weekStart = new Date(d.setDate(diff));
        const dateStr = weekStart.toISOString().split("T")[0];

        const typeKey = dateStr + item.type;
        if (!aggMap.has(typeKey)) {
          aggMap.set(typeKey, { ...item, date: dateStr });
        } else {
          aggMap.get(typeKey).count += item.count;
        }
      });
      finalChartData = Array.from(aggMap.values());
    } else {
      finalChartData = chartData;
    }

    // 8. Stats & Table
    const avgHistorical =
      historicalDaysCount > 0
        ? totalHistoricalPassengers / historicalDaysCount
        : 0;
    const avgPredicted =
      predictionDates.length > 0
        ? totalPredictedVol / predictionDates.length
        : 0;

    let growthRate = 0;
    if (avgHistorical > 0) {
      growthRate = ((avgPredicted - avgHistorical) / avgHistorical) * 100;
    }

    const peakDateObj = maxPredDate ? new Date(maxPredDate) : null;
    const peakLabel = peakDateObj
      ? peakDateObj.toLocaleDateString("en-US", { weekday: "long" })
      : "-";

    // Table (Today or Start of Range)
    // If custom range is in future, use start of custom range. If includes today, use today.
    let tableTargetDate = new Date();
    if (range === "custom" && customStartDate) {
      const start = new Date(customStartDate);
      if (start > today) tableTargetDate = start;
    }

    const tableFeatures = routes.map((route) =>
      this.getFeaturesForRouteDate(route, tableTargetDate, routeHistoryMap)
    );
    let tablePredictionsRaw = [];
    try {
      tablePredictionsRaw = await this.callPythonApi(
        pythonApiUrl,
        tableFeatures
      );
    } catch (e) {
      tablePredictionsRaw = tableFeatures.map(() => 0);
    }

    const routePredictions = routes.map((route, index) => {
      const predicted =
        tablePredictionsRaw && tablePredictionsRaw[index]
          ? Math.max(0, Math.round(tablePredictionsRaw[index]))
          : 0;
      const currentBuses = busCountMap[route.id]?.count || 0;
      const currentCapacity = busCountMap[route.id]?.capacity || 0;
      const utilization =
        currentCapacity > 0
          ? Math.round((predicted / currentCapacity) * 100)
          : predicted > 0
          ? 100
          : 0;
      const neededBuses = Math.ceil(predicted / 50);
      const gap = currentCapacity - predicted;

      let status = "Sufficient";
      if (utilization > 90) status = "Critically High";
      else if (utilization > 75) status = "High Demand";
      else if (utilization < 30) status = "Underutilized";

      return {
        id: route.id,
        route_number: route.route_number,
        name: route.route_name,
        prediction: predicted,
        current_buses: currentBuses,
        current_capacity: currentCapacity,
        utilization: utilization,
        needed_buses: neededBuses,
        gap: gap,
        status: status,
      };
    });

    const overallUtilization =
      routePredictions.reduce((sum, r) => sum + r.utilization, 0) /
      (routePredictions.length || 1);
    let demandLevel = "Moderate";
    if (overallUtilization > 80) demandLevel = "High";
    if (overallUtilization < 40) demandLevel = "Low";

    return {
      chartData: finalChartData,
      byRoute: routePredictions,
      totalPredicted: Math.round(totalPredictedVol),
      accuracy: "N/A", // Need real data to calc
      timestamp: new Date().toISOString(),
      stats: {
        growthRate: growthRate.toFixed(1),
        peakLabel: peakLabel,
        demandLevel: demandLevel,
        avgDaily: Math.round(avgPredicted),
      },
    };
  }

  static async callPythonApi(url, featureSets) {
    // Removed try-catch fallback. Now throws if fails.
    const response = await axios.post(`${url}/predict`, featureSets);
    return response.data.predictions;
  }

  static async assignBuses(routeId, count) {
    const busSnapshot = await db
      .collection("buses")
      .where("status", "==", "active")
      .get();
    const available = [];
    busSnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        !data.current_route_id ||
        data.current_route_id === "0" ||
        data.current_route_id === 0
      ) {
        available.push({ id: doc.id });
      }
    });

    if (available.length < count) {
      const error = new Error(
        `Not enough available buses. Requested ${count}, found ${available.length}`
      );
      error.status = 400;
      throw error;
    }

    const batch = db.batch();
    available.slice(0, count).forEach((bus) => {
      batch.update(db.collection("buses").doc(bus.id), {
        current_route_id: routeId,
      });
    });
    await batch.commit();

    return available.slice(0, count).map((b) => b.id);
  }
}

module.exports = PredictionService;
