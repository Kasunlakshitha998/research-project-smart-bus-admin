import { useState, useEffect } from "react";
import {
  Users,
  Bus,
  Map,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dashboardService from "../services/dashboardService";

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  gradient,
  loading,
}) => (
  <div
    className={`p-6 rounded-2xl shadow-sm border border-white/20 relative overflow-hidden group transition-all hover:shadow-lg ${gradient}`}
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
        {!loading && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white`}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-white/80">{title}</p>
      {loading ? (
        <div className="h-9 w-24 bg-white/20 animate-pulse rounded mt-1"></div>
      ) : (
        <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const stats = await dashboardService.getStats();
      setData(stats);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (!data && loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { stats, trafficTrend, complaintsBreakdown, recentActivities } =
    data || {
      stats: {},
      trafficTrend: [],
      complaintsBreakdown: [],
      recentActivities: [],
    };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            System Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time overview of bus operations and passenger analytics.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock size={16} />
          <span>Last updated: Just now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Passengers"
          value={stats.totalPassengers}
          change={stats.passengersChange}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-600 to-blue-400"
          loading={loading}
        />
        <StatCard
          title="Active Buses"
          value={stats.activeBuses}
          change={stats.busesChange}
          icon={Bus}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-400"
          loading={loading}
        />
        <StatCard
          title="Active Routes"
          value={stats.activeRoutes}
          change={stats.routesChange}
          icon={Map}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-400"
          loading={loading}
        />
        <StatCard
          title="Pending Complaints"
          value={stats.pendingComplaints}
          change={stats.complaintsChange}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-orange-600 to-orange-400"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Traffic Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Passenger Traffic Trend
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Last 7 Days (Actual)
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTrend}>
                <defs>
                  <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="passengers"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPass)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Complaints Breakdown
          </h2>
          {complaintsBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintsBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complaintsBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-center">
              <AlertTriangle size={48} className="opacity-10 mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">
                No Complaint Data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Recent System Activity
          </h2>
          <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center">
            View all <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-6">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`p-2 rounded-xl bg-blue-50 text-blue-600`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">
              No recent activity detected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
