import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Bus,
  User,
  TrendingUp,
  Shield,
  MessageSquare,
  ArrowRight,
  Search,
  Filter,
  ExternalLink,
  Activity,
  Info,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";

// Custom Marker for Context Map
const incidentIcon = L.divIcon({
  html: `
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-50 shadow-xl border-2 border-red-500 animate-pulse">
            <div class="w-3 h-3 rounded-full bg-red-600"></div>
        </div>
    `,
  className: "incident-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const ComplaintAnalysis = () => {
  // RICH MOCK DATA WITH TELEMETRY SNAPSHOTS
  const [complaints, setComplaints] = useState(() => [
    {
      id: "C-9901",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      bus_plate: "WP NB-5432",
      route: "138",
      category: "Driver Behavior",
      description:
        "The driver was driving very aggressively and ignoring traffic signals at the Nugegoda junction. Very dangerous for passengers.",
      status: "pending",
      sentiment: "Negative",
      telemetry: {
        lat: 6.8741,
        lng: 79.8887,
        speed: "65 km/h",
        occupancy: "92%",
        driver: "Saman Kumara",
        limit: "40 km/h (Exceeded)",
      },
    },
    {
      id: "C-9902",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      bus_plate: "WP NB-8721",
      route: "177",
      category: "Cleanliness",
      description:
        "The back seats were very dusty and there was trash left on the floor. Needs immediate attention at the terminal.",
      status: "resolved",
      sentiment: "Neutral",
      telemetry: {
        lat: 6.9147,
        lng: 79.9733,
        speed: "12 km/h",
        occupancy: "30%",
        driver: "Sunil Perera",
        limit: "50 km/h",
      },
    },
    {
      id: "C-9903",
      created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      bus_plate: "WP NA-3321",
      route: "120",
      category: "Delay",
      description:
        "The bus skipped two stops in Piliyandala, forcing us to wait for another 20 minutes. This is a recurring issue.",
      status: "pending",
      sentiment: "Very Negative",
      telemetry: {
        lat: 6.84,
        lng: 79.96,
        speed: "48 km/h",
        occupancy: "75%",
        driver: "Kamal Silva",
        limit: "50 km/h",
      },
    },
    {
      id: "C-9904",
      created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      bus_plate: "WP NC-1122",
      route: "138",
      category: "AC/Facility",
      description:
        "AC was not working during the morning trip. It was very uncomfortable as the bus was packed.",
      status: "pending",
      sentiment: "Negative",
      telemetry: {
        lat: 6.91,
        lng: 79.88,
        speed: "35 km/h",
        occupancy: "100%",
        driver: "Ajith Fernado",
        limit: "50 km/h",
      },
    },
  ]);

  const [selectedComplaint, setSelectedComplaint] = useState(complaints[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      sentimentScore: 68, // Mock score
      byCategory: [
        { category: "Behavior", count: 12 },
        { category: "Cleanliness", count: 8 },
        { category: "Delay", count: 15 },
        { category: "Facilities", count: 5 },
      ],
      dailyTrend: [
        { day: "Mon", count: 4 },
        { day: "Tue", count: 6 },
        { day: "Wed", count: 8 },
        { day: "Thu", count: 5 },
        { day: "Fri", count: 12 },
        { day: "Sat", count: 7 },
        { day: "Sun", count: 3 },
      ],
    }),
    [complaints]
  );

  const filteredComplaints = useMemo(
    () =>
      complaints.filter(
        (c) =>
          c.bus_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.id.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [complaints, searchQuery]
  );

  const updateStatus = (id, newStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (selectedComplaint?.id === id) {
      setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* LEFT SIDEBAR: Master List & Stats */}
      <div className="w-[400px] flex flex-col bg-white border-r border-slate-200 shadow-xl z-20">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Complaints
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Intelligence Engine
              </p>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100">
                <Filter className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search incidents..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Stats Capsules */}
          <div className="flex space-x-2">
            {[
              {
                label: "Pending",
                value: stats.pending,
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
              {
                label: "Resolved",
                value: stats.resolved,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Total",
                value: stats.total,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
            ].map((s, i) => (
              <div
                key={i}
                className={clsx(
                  "flex-1 py-2 px-3 rounded-lg text-center border border-transparent hover:border-slate-200 transition-all cursor-default",
                  s.bg
                )}
              >
                <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">
                  {s.label}
                </p>
                <p className={clsx("text-sm font-black", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Master List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {filteredComplaints.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedComplaint(c)}
              className={clsx(
                "w-full p-4 rounded-xl border text-left transition-all group relative overflow-hidden",
                selectedComplaint?.id === c.id
                  ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20 shadow-md"
                  : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={clsx(
                    "text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md",
                    selectedComplaint?.id === c.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {c.id}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(c.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs mb-1 group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                {c.category}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">
                {c.bus_plate} • {c.description}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div
                    className={clsx(
                      "h-1.5 w-1.5 rounded-full animate-pulse",
                      c.status === "pending" ? "bg-orange-500" : "bg-green-500"
                    )}
                  />
                  <span
                    className={clsx(
                      "text-[9px] font-black uppercase",
                      c.status === "pending"
                        ? "text-orange-600"
                        : "text-green-600"
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                {selectedComplaint?.id === c.id && (
                  <ArrowRight size={14} className="text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Investigation Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        {selectedComplaint ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Workspace Header */}
            <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-xs font-bold text-slate-400">
                  <span className="hover:text-blue-600 cursor-pointer">
                    Intelligence
                  </span>
                  <ArrowRight size={12} className="mx-2 opacity-30" />
                  <span className="text-slate-900 uppercase">
                    Incident {selectedComplaint.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center">
                  <Activity size={14} className="text-slate-400 mr-2" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    Live Telemetry Link Active
                  </span>
                </div>
                {selectedComplaint.status === "pending" ? (
                  <button
                    onClick={() =>
                      updateStatus(selectedComplaint.id, "resolved")
                    }
                    className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </button>
                ) : (
                  <div className="px-6 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 font-bold text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolved
                  </div>
                )}
              </div>
            </header>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-12 gap-8">
                {/* Primary Report Card */}
                <div className="col-span-7 space-y-8">
                  <div className="bg-white rounded-4xl border border-slate-200/60 shadow-sm overflow-hidden p-10 relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
                      <MessageSquare size={160} />
                    </div>

                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                        <AlertCircle size={20} />
                      </div>
                      <span className="text-xs font-black text-red-600 uppercase tracking-[0.2em]">
                        {selectedComplaint.category} Report
                      </span>
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                      "{selectedComplaint.description}"
                    </h2>

                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                      <div className="flex items-center space-x-8">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Sentiment Analysis
                          </p>
                          <div
                            className={clsx(
                              "flex items-center px-3 py-1 rounded-full text-xs font-black uppercase",
                              selectedComplaint.sentiment.includes("Negative")
                                ? "bg-red-50 text-red-600"
                                : "bg-slate-50 text-slate-600"
                            )}
                          >
                            <div
                              className={clsx(
                                "h-1.5 w-1.5 rounded-full mr-2",
                                selectedComplaint.sentiment.includes("Negative")
                                  ? "bg-red-500"
                                  : "bg-slate-400"
                              )}
                            />
                            {selectedComplaint.sentiment}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Filed On
                          </p>
                          <p className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                            {new Date(
                              selectedComplaint.created_at
                            ).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 border border-slate-100">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Snapshot Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "Assigned Driver",
                        value: selectedComplaint.telemetry.driver,
                        icon: User,
                        color: "text-blue-500",
                        bg: "bg-blue-50",
                      },
                      {
                        label: "Vehicle Plate",
                        value: selectedComplaint.bus_plate,
                        icon: Bus,
                        color: "text-indigo-500",
                        bg: "bg-indigo-50",
                      },
                      {
                        label: "Speed at Incident",
                        value: selectedComplaint.telemetry.speed,
                        icon: Activity,
                        color: "text-red-500",
                        bg: "bg-red-50",
                        sub: selectedComplaint.telemetry.limit,
                      },
                      {
                        label: "Passenger Load",
                        value: selectedComplaint.telemetry.occupancy,
                        icon: User,
                        color: "text-green-500",
                        bg: "bg-green-50",
                      },
                    ].map((t, i) => (
                      <div
                        key={i}
                        className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-start space-x-4"
                      >
                        <div className={clsx("p-3 rounded-2xl", t.bg, t.color)}>
                          <t.icon size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t.label}
                          </p>
                          <p className="text-lg font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">
                            {t.value}
                          </p>
                          {t.sub && (
                            <p className="text-[9px] font-bold text-red-500 uppercase">
                              {t.sub}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Context Mapping Panel */}
                <div className="col-span-5 h-full min-h-[600px] bg-white rounded-4xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm z-10 shrink-0">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        Geospatial Context
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        GPS Snap-Point at Time of Filing
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        +3
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 relative grayscale-[0.2]">
                    <MapContainer
                      center={[
                        selectedComplaint.telemetry.lat,
                        selectedComplaint.telemetry.lng,
                      ]}
                      zoom={15}
                      className="h-full w-full z-0"
                      zoomControl={false}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[
                          selectedComplaint.telemetry.lat,
                          selectedComplaint.telemetry.lng,
                        ]}
                        icon={incidentIcon}
                      />
                    </MapContainer>

                    <div className="absolute bottom-6 left-6 right-6 z-10">
                      <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl text-white border border-white/10 shadow-2xl">
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                            Incident Sector Coordinates
                          </p>
                        </div>
                        <p className="text-sm font-black font-mono tracking-tighter mt-1">
                          {selectedComplaint.telemetry.lat.toFixed(4)}° N,{" "}
                          {selectedComplaint.telemetry.lng.toFixed(4)}° E
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div className="p-8 bg-white rounded-full border-2 border-dashed border-slate-200 mb-6">
              <Shield size={64} className="opacity-20" />
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-sm text-slate-400">
              Select an investigation to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintAnalysis;
