import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
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
import {
  TrendingUp,
  Users,
  Calendar,
  Bus,
  Save,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import predictionService from "../services/predictionService";
import routeService from "../services/routeService";
import Loading from "../components/Loading";
import busAllocationService from "../services/busAllocationService";
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
  const [allocationDate, setAllocationDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [buses, setBuses] = useState([]);
  const [busPage, setBusPage] = useState(1);
  const [busesPerPage] = useState(8);
  const [fetchingBuses, setFetchingBuses] = useState(false);

  // Assignment Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const { user } = useAuth();

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await routeService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  }, []);

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
        allocationDate,
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

        // Fetch detailed allocations with overrides
        const allocationDetails = await busAllocationService.getAllocations(
          allocationDate,
          routeQuery,
        );
        setAllocations(allocationDetails || []);

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
  }, [selectedRoute, timeRange, customRange, allocationDate]);

  const fetchBuses = useCallback(async () => {
    setFetchingBuses(true);
    try {
      const data = await busService.getAllBuses();
      setBuses(data || []);
    } catch (err) {
      console.error("Error fetching buses:", err);
    } finally {
      setFetchingBuses(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    fetchBuses();
  }, [fetchRoutes, fetchBuses]);

  useEffect(() => {
    if (timeRange !== "custom" || (customRange.start && customRange.end)) {
      fetchPredictions();
    }
  }, [fetchPredictions, timeRange, customRange, allocationDate]);

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

  const handlePreviewAssignment = async (routeId, neededCount) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setAssigningRouteId(routeId);
    try {
      const data = await busAllocationService.getAssignmentPreview(
        routeId,
        neededCount,
      );
      setPreviewData(data);
      setIsPreviewModalOpen(true);
    } catch (err) {
      console.error("Error fetching preview:", err);
      setPreviewError(
        "Failed to load assignment preview. Please check available buses.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!previewData || !assigningRouteId) return;
    setAssignmentLoading(true);
    try {
      const promises = previewData.buses.map((bus) =>
        busService.updateBus(bus.id, { current_route_id: assigningRouteId }),
      );
      await Promise.all(promises);
      setIsPreviewModalOpen(false);
      setPreviewData(null);

      toast.success(`Successfully assigned ${previewData.buses.length} buses.`);
      fetchPredictions();
      fetchBuses();
    } catch (err) {
      console.error("Error confirming assignment:", err);
      toast.error("Failed to assign some buses. Please try again.");
    } finally {
      setAssignmentLoading(false);
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
      toast.success("Bus assignments applied successfully!");
      fetchPredictions();
    } catch (error) {
      console.error("Error applying bulk assignments:", error);
      toast.error(
        error.response?.data?.error || "Failed to apply assignments.",
      );
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
  }, [allocations, currentPage, itemsPerPage]);

  const paginatedBuses = useMemo(() => {
    const startIndex = (busPage - 1) * busesPerPage;
    return buses.slice(startIndex, startIndex + busesPerPage);
  }, [buses, busPage, busesPerPage]);

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
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-bold text-gray-900">
              Recommended Bus Allocations (
              {allocationDate === new Date().toISOString().split("T")[0]
                ? "Today"
                : allocationDate}
              )
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Based on AI capacity analysis for the selected date.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
            <button
              onClick={() =>
                setAllocationDate(new Date().toISOString().split("T")[0])
              }
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                allocationDate === new Date().toISOString().split("T")[0]
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setAllocationDate(tomorrow.toISOString().split("T")[0]);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                allocationDate ===
                new Date(new Date().setDate(new Date().getDate() + 1))
                  .toISOString()
                  .split("T")[0]
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tomorrow
            </button>
            <input
              type="date"
              className="text-xs font-bold px-2 py-1.5 border-none outline-none text-gray-700"
              value={allocationDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setAllocationDate(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2 px-4">
            <thead className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2">Route Details</th>
                <th className="px-4 py-2 text-center">Demand</th>
                <th className="px-4 py-2 text-center">In Fleet</th>
                <th className="px-4 py-2 text-center">AI Need</th>
                <th className="px-4 py-2 text-center">New Req (Gap)</th>
                <th className="px-4 py-2 text-center">Final Plan</th>
                <th className="px-4 py-2">Utilization</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {paginatedAllocations.map((d) => {
                const isOverridden =
                  overrides[d.routeId] !== undefined &&
                  overrides[d.routeId] !== null;

                // The input and display now represent the GAP (additional buses needed)
                const currentManualGap =
                  d.managerOverride !== null
                    ? Math.max(0, d.managerOverride - d.currentBuses)
                    : null;
                const activeGap =
                  overrides[d.routeId] ?? currentManualGap ?? d.gap;

                const finalBusCount = d.currentBuses + activeGap;

                const totalDailyCapacity = finalBusCount * d.dailyBusCapacity;
                const utilization =
                  totalDailyCapacity > 0
                    ? Math.round(
                        (d.predictedPassengers / totalDailyCapacity) * 100,
                      )
                    : d.predictedPassengers > 0
                      ? 100
                      : 0;

                return (
                  <tr
                    key={d.routeId}
                    className="group bg-white hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl overflow-hidden border border-gray-100"
                  >
                    <td className="px-4 py-4 first:rounded-l-2xl border-y border-l border-gray-100 group-hover:border-blue-100">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-100">
                          <Bus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-black text-gray-900 leading-tight">
                            {d.routeNumber}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            {d.routeName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-gray-100 group-hover:border-blue-100 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-gray-900 text-base">
                          {d.predictedPassengers}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          Passengers
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-gray-100 group-hover:border-blue-100 text-center">
                      <div className="inline-flex flex-col items-center bg-gray-50 px-3 py-1 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">
                          In Fleet
                        </span>
                        <span className="font-black text-gray-900 text-lg leading-none">
                          {d.currentBuses}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-gray-100 group-hover:border-blue-100 text-center">
                      <div className="inline-flex flex-col items-center bg-blue-50/50 px-3 py-1 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-black text-blue-400 uppercase leading-none mb-1">
                          AI Need
                        </span>
                        <span className="font-black text-blue-600 text-lg leading-none">
                          {d.suggestedBuses}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-gray-100 group-hover:border-blue-100 text-center">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            className={`w-20 pl-3 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-black transition-all text-center ${
                              isOverridden
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                            value={overrides[d.routeId] ?? ""}
                            placeholder={d.gap}
                            onChange={(e) =>
                              setOverrides({
                                ...overrides,
                                [d.routeId]:
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-gray-100 group-hover:border-blue-100 text-center">
                      <div className="inline-flex flex-col items-center bg-indigo-50/30 px-3 py-1 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">
                          Target
                        </span>
                        <span className="font-black text-indigo-600 text-lg leading-none">
                          {finalBusCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-y border-gray-100 group-hover:border-blue-100">
                      <div className="flex flex-col space-y-1 w-24">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">
                            Util.
                          </span>
                          <span className="text-[10px] font-black text-gray-700">
                            {utilization}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              utilization > 90
                                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                : utilization > 70
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 last:rounded-r-2xl border-y border-r border-gray-100 group-hover:border-blue-100 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openAssignModal(d.routeId)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                          title="Manual Dispatch"
                        >
                          <Zap size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handlePreviewAssignment(d.routeId, activeGap)
                          }
                          disabled={activeGap <= 0 || previewLoading}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center ${
                            activeGap > 0
                              ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200 active:scale-95"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          }`}
                        >
                          {previewLoading && assigningRouteId === d.routeId ? (
                            <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <ShieldCheck className="h-3 w-3 mr-1.5" />
                          )}
                          {d.gap > 0 ? "Dispatch" : "Ideal"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginatedAllocations.map((d) => {
            const currentManualGap =
              d.managerOverride !== null
                ? Math.max(0, d.managerOverride - d.currentBuses)
                : null;
            const activeGap = overrides[d.routeId] ?? currentManualGap ?? d.gap;

            const finalBusCount = d.currentBuses + activeGap;

            const utilization =
              d.dailyBusCapacity > 0
                ? Math.round(
                    (d.predictedPassengers /
                      (finalBusCount * d.dailyBusCapacity)) *
                      100,
                  )
                : 0;
            return (
              <div key={d.routeId} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                      <Bus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        Route {d.routeNumber}
                      </div>
                      <div className="text-xs text-gray-500">{d.routeName}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase">
                      Final Plan
                    </span>
                    <span className="text-lg font-black text-indigo-600">
                      {finalBusCount} Units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                      In Fleet
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {d.currentBuses} Units
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] text-blue-400 font-black uppercase mb-1">
                      AI Need
                    </p>
                    <p className="text-sm font-black text-blue-600">
                      {d.suggestedBuses} Units
                    </p>
                  </div>
                  <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <p className="text-[10px] text-orange-400 font-black uppercase mb-1">
                      New Req (Gap)
                    </p>
                    <p
                      className={`text-sm font-black ${activeGap > 0 ? "text-orange-600" : "text-gray-400"}`}
                    >
                      +{activeGap} Units
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                      Utilization
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {utilization}% Cap.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-4 pt-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        utilization > 90
                          ? "bg-red-500"
                          : utilization > 70
                            ? "bg-orange-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() =>
                      handlePreviewAssignment(d.routeId, activeGap)
                    }
                    disabled={activeGap <= 0 || previewLoading}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all shadow-sm ${
                      activeGap > 0
                        ? "bg-blue-600 text-white active:scale-95 shadow-lg shadow-blue-100"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {previewLoading && assigningRouteId === d.routeId ? (
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Dispatch Now"
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Demand: {d.predictedPassengers} Pax
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase">
                    <span>{d.tripsPerBus} Trips/Bus</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      Override:
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      value={overrides[d.routeId] ?? ""}
                      placeholder="None"
                      onChange={(e) =>
                        setOverrides({
                          ...overrides,
                          [d.routeId]:
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openAssignModal(d.routeId)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all border border-gray-200"
                  >
                    Manual Dispatch
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* Bus Fleet Section */}
      <div className="bg-white mt-10 rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center">
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <Bus className="h-5 w-5 text-blue-600" />
              </div>
              Main Bus Fleet
            </h2>
            <p className="text-sm text-gray-400 font-medium">
              Management of active bus units across all routes
            </p>
          </div>
          <p className="text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            {buses.length} Total Units
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Bus Details</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Current Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetchingBuses ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-400 font-medium"
                  >
                    Fetching fleet data...
                  </td>
                </tr>
              ) : paginatedBuses.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-400 font-medium"
                  >
                    No buses found in fleet
                  </td>
                </tr>
              ) : (
                paginatedBuses.map((bus) => (
                  <tr
                    key={bus.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-9 w-9 bg-gray-50 rounded-xl flex items-center justify-center mr-3 border border-gray-100">
                          <Bus className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="font-bold text-gray-900">
                          {bus.license_plate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {bus.model || "Standard"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        {bus.capacity} Pax
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${
                          bus.status === "active"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}
                      >
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bus.current_route_id ? (
                        <div className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-fit">
                          Route {bus.current_route_id}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          Idle / Available
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-50">
          <Pagination
            currentPage={busPage}
            totalItems={buses.length}
            itemsPerPage={busesPerPage}
            onPageChange={setBusPage}
          />
        </div>
      </div>

      {/* Assignment Preview Modal */}
      {isPreviewModalOpen && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 transform animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="absolute top-6 right-6 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
                <Bus className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">
                Assignment Preview
              </h3>
              <p className="text-blue-100 font-medium">
                Route {assigningRouteId}: AI has found{" "}
                {previewData.buses.length} suitable vehicles.
              </p>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                    Proposed Fleet Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(previewData.summary).map(
                      ([capacity, count]) => (
                        <div
                          key={capacity}
                          className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                              {capacity} Seats
                            </div>
                            <div className="text-xl font-black text-gray-900">
                              {count} Units
                            </div>
                          </div>
                          <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-500" />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                    Specific Bus Assignments
                  </h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {previewData.buses.map((bus) => (
                      <div
                        key={bus.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 bg-green-400 rounded-full group-hover:animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                          <span className="font-black text-gray-900 text-sm tracking-tight">
                            {bus.license_plate}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          {bus.capacity} CAPACITY
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!previewData.isEnough && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3">
                    <div className="h-5 w-5 text-orange-500 mt-0.5">⚠️</div>
                    <p className="text-xs text-orange-800 font-bold leading-relaxed">
                      Limited resources: AI found {previewData.buses.length}{" "}
                      buses, but Route {assigningRouteId} needs more units. Only{" "}
                      {previewData.availableCount} buses are currently idle in
                      the fleet.
                    </p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAssignment}
                    disabled={
                      assignmentLoading || previewData.buses.length === 0
                    }
                    className="flex-2 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center"
                  >
                    {assignmentLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Confirm & Assign Fleet"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
