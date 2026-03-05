import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Users, Calendar, Bus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import predictionService from "../services/predictionService";
import routeService from "../services/routeService";
import Loading from "../components/Loading";
import busService from "../services/busService";
import Pagination from "../components/Pagination";

const processChartData = (rawData) => {
  if (!rawData) return [];
  const map = new Map();
  rawData.forEach((item) => {
    if (!map.has(item.date)) {
      map.set(item.date, { date: item.date });
    }
    const entry = map.get(item.date);
    if (item.type === "actual") {
      entry.actual_passengers = item.count;
    } else {
      entry.predicted_passengers = item.count;
      entry.ci_upper = Math.round(item.count * 1.15);
      entry.ci_lower = Math.round(item.count * 0.85);
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
};

const PassengerPrediction = () => {
  const [chartData, setChartData] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [stats, setStats] = useState({
    totalPredicted: 0,
    accuracy: "0%",
    growthRate: 0,
    peakLabel: "-",
    demandLevel: "Moderate",
  });
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("All Routes");
  // daily, weekly, monthly
  const [timeRange, setTimeRange] = useState("daily");

  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [error, setError] = useState(null);

  // New state for manual assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [assigningRouteId, setAssigningRouteId] = useState(null);
  const [busLoading, setBusLoading] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { user } = useAuth();

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const routeQuery = selectedRoute === "All Routes" ? "all" : selectedRoute;

      // Validate custom range if selected
      if (timeRange === "custom" && (!customRange.start || !customRange.end)) {
        setLoading(false);
        return; // Wait for both dates
      }

      const data = await predictionService.getPredictions(
        routeQuery,
        timeRange,
        timeRange === "custom" ? customRange.start : null,
        timeRange === "custom" ? customRange.end : null,
      );

      if (data.stats?.error || data.chartData.length === 0) {
        setError(
          data.stats?.error || "Data not available for selected criteria",
        );
        setChartData([]);
        setAllocations([]);
        setStats({
          totalPredicted: 0,
          accuracy: "N/A",
          growthRate: 0,
          peakLabel: "-",
          demandLevel: "-",
        });
      } else {
        const processedChart = processChartData(data.chartData);
        setChartData(processedChart);
        setAllocations(data.byRoute || []);
        setCurrentPage(1); // Reset page on data fetch/filter change
        setStats({
          totalPredicted: data.totalPredicted,
          accuracy: data.accuracy,
          growthRate: data.stats?.growthRate || 0,
          peakLabel: data.stats?.peakLabel || "-",
          demandLevel: data.stats?.demandLevel || "Moderate",
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setError("Failed to fetch prediction data. Please try again.");
      setLoading(false);
    }
  }, [selectedRoute, timeRange, customRange]);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (timeRange !== "custom" || (customRange.start && customRange.end)) {
      fetchPredictions();
    }
  }, [fetchPredictions, timeRange, customRange]);

  const openAssignModal = async (routeId) => {
    setAssigningRouteId(routeId);
    setIsAssignModalOpen(true);
    setBusLoading(true);
    try {
      const buses = await busService.getAllBuses();
      const available = buses.filter(
        (b) =>
          b.status === "active" &&
          (!b.current_route_id ||
            b.current_route_id === "0" ||
            b.current_route_id === 0),
      );
      setAvailableBuses(available);
    } catch (error) {
      console.error("Error fetching buses:", error);
    } finally {
      setBusLoading(false);
    }
  };

  const handleAssignSingleBus = async (busId) => {
    if (!assigningRouteId) return;
    try {
      await busService.updateBus(busId, { current_route_id: assigningRouteId });
      setIsAssignModalOpen(false);
      fetchPredictions();
    } catch (error) {
      console.error("Error assigning bus:", error);
    }
  };
  const handleApplyBulkAssignments = async () => {
    setAssignmentLoading(true);
    try {
      const finalAssignments = allocations.map((route) => ({
        routeId: route.id,
        count: overrides[route.id] ?? route.needed_buses,
      }));

      await predictionService.applyBulkAssignments(finalAssignments);
      alert("Bus assignments applied successfully!");
      fetchPredictions();
    } catch (error) {
      console.error("Error applying bulk assignments:", error);
      alert(error.response?.data?.error || "Failed to apply assignments.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Critically High":
        return "bg-red-100 text-red-800";
      case "High Demand":
        return "bg-orange-100 text-orange-800";
      case "Sufficient":
        return "bg-green-100 text-green-800";
      case "Underutilized":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const paginatedAllocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allocations.slice(startIndex, startIndex + itemsPerPage);
  }, [allocations, currentPage]);

  if (loading && !chartData.length && !error) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Passenger Flow Prediction {user?.name && ` - ${user.name}`}
          </h1>
          <p className="text-gray-500">
            AI-driven demand forecasting for peak hours.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
            {["daily", "weekly", "monthly", "custom"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md transition-all capitalize ${
                  timeRange === range
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {timeRange === "custom" && (
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange({ ...customRange, start: e.target.value })
                }
              />
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange({ ...customRange, end: e.target.value })
                }
              />
            </div>
          )}

          <select
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 h-[42px]"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
          >
            <option value="All Routes">All Routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                Route {route.route_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-yellow-50 text-yellow-800 p-8 rounded-xl text-center border border-yellow-100 mb-8">
          <h3 className="text-lg font-bold mb-2">No Data Available</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-gray-500 mb-2 text-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="font-medium">Growth Rate</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  stats.growthRate >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {stats.growthRate > 0 ? "+" : ""}
                {stats.growthRate}%
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-gray-500 mb-2 text-sm">
                <Users className="h-4 w-4 mr-2" />
                <span className="font-medium">Total Predicted</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalPredicted.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-gray-500 mb-2 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Peak Day</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.peakLabel}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-gray-500 mb-2 text-sm">
                <Bus className="h-4 w-4 mr-2" />
                <span className="font-medium">Demand Level</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  stats.demandLevel === "High"
                    ? "text-orange-500"
                    : stats.demandLevel === "Low"
                      ? "text-green-500"
                      : "text-blue-500"
                }`}
              >
                {stats.demandLevel}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              {loading && chartData.length > 0 && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
                  <Loading />
                </div>
              )}
              <h2 className="text-lg font-bold mb-6 capitalize">
                {timeRange} Passenger Demand Forecast
              </h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(str) => {
                        const date = new Date(str);
                        if (timeRange === "daily")
                          return date.toLocaleDateString("en-US", {
                            weekday: "short",
                          });
                        if (timeRange === "monthly")
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                          });
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString()
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="predicted_passengers"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      strokeWidth={3}
                      name="Predicted"
                      activeDot={{ r: 6 }}
                    />
                    {/* Confidence Interval Area (Visual only) */}
                    <Area
                      type="monotone"
                      dataKey="ci_upper"
                      stroke="none"
                      fill="#8b5cf6"
                      fillOpacity={0.1}
                      name="Confidence Interval"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual_passengers"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                      name="Actual Historical"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">
            Recommended Bus Allocations (Today)
          </h2>
          <span className="text-sm text-gray-500">
            Based on real-time capacity analysis
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Predicted Demand</th>
                <th className="px-6 py-3">Current Cap.</th>
                <th className="px-6 py-3">Utilization</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Needed / Override</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedAllocations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <Bus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {d.route_number}
                        </div>
                        <div className="text-xs text-gray-500">{d.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{d.prediction}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {d.current_capacity}{" "}
                    <span className="text-xs">({d.current_buses} buses)</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            d.utilization > 100 ? "bg-red-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(d.utilization, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">
                        {d.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        d.status,
                      )}`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-gray-400 text-xs">
                        Needed: {d.needed_buses}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-xs focus:ring-1 focus:ring-blue-500"
                        value={overrides[d.id] ?? d.needed_buses}
                        onChange={(e) =>
                          setOverrides({
                            ...overrides,
                            [d.id]: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openAssignModal(d.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs transition-colors"
                    >
                      Manual
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={handleApplyBulkAssignments}
            disabled={assignmentLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold transition-colors shadow-sm flex items-center disabled:bg-blue-400"
          >
            {assignmentLoading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Automatically Assign Predicted Buses
          </button>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={allocations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
      {/* Assign Bus Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Assign Bus to Route
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {busLoading ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : availableBuses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available active buses found.
                </div>
              ) : (
                <div className="space-y-3">
                  {availableBuses.map((bus) => (
                    <div
                      key={bus.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Bus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {bus.bus_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            Capacity: {bus.capacity}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignSingleBus(bus.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerPrediction;
