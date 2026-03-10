import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";
import complaintService from "../services/complaintService";

const formatDate = (dateValue) => {
  if (!dateValue) return null;

  // Handle Firestore Timestamp objects (_seconds, _nanoseconds)
  if (typeof dateValue === "object" && dateValue._seconds) {
    return new Date(dateValue._seconds * 1000);
  }

  // Handle native Firebase Timestamp objects with .toDate() method
  if (typeof dateValue.toDate === "function") {
    return dateValue.toDate();
  }

  // Fallback for standard Date or ISO string
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

// Safe wrapper — always returns a displayable string
const formatDateStr = (dateValue, options) => {
  const d = formatDate(dateValue);
  if (!d) return "N/A";
  return options ? d.toLocaleString("en-US", options) : d.toLocaleString();
};

const formatTimeStr = (dateValue) => {
  const d = formatDate(dateValue);
  if (!d) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

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

const ResolutionModal = ({ isOpen, onClose, onConfirm, category }) => {
  const [message, setMessage] = useState("");
  const [selectedPredefined, setSelectedPredefined] = useState("");

  const predefinedMessages = {
    "Over Speeding": [
      "Issue investigated and driver warned regarding speed limits.",
      "Telemetric data confirmed speeding; driver disciplinary action initiated.",
      "False report; telemetry shows bus was within speed limits.",
    ],
    "Driver Behavior": [
      "Driver has been summoned for a formal inquiry regarding behavior.",
      "Warning issued to the driver; record updated.",
      "Communication training scheduled for the assigned driver.",
    ],
    Delay: [
      "Delay was due to unforeseen traffic conditions; passenger notified.",
      "Route timing adjusted to prevent future delays.",
      "Scheduling conflict resolved.",
    ],
    "Route Deviation": [
      "Unauthorized route deviation confirmed; driver penalized.",
      "Deviation was due to road closure/construction.",
      "Directional guidance provided to the driver.",
    ],
    Cleanliness: [
      "Bus scheduled for immediate intensive cleaning.",
      "Daily cleaning protocol reinforced for this vehicle.",
      "Maintenance team notified of the interior condition.",
    ],
    Other: [
      "Issue resolved following internal investigation.",
      "Maintenance scheduled to address the reported concern.",
      "Thank you for the feedback; improvements have been implemented.",
    ],
  };

  const options = predefinedMessages[category] || predefinedMessages["Other"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Resolve Complaint
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Quick Resolution Tips
            </label>
            <div className="grid grid-cols-1 gap-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedPredefined(opt);
                    setMessage(opt);
                  }}
                  className={clsx(
                    "text-left p-3 rounded-xl text-xs font-bold border transition-all",
                    selectedPredefined === opt
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                      : "bg-white border-slate-100 text-slate-500 hover:border-slate-200",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Resolution Narrative
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what actions were taken to resolve this..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!message.trim()}
            onClick={() => onConfirm(message)}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 transition-all flex items-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Resolution
          </button>
        </div>
      </div>
    </div>
  );
};

const ComplaintAnalysis = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // If user is an agent, filter by their ID
      const agentId = user?.role_id === "3" ? user.id : null;
      console.log("Fetching complaints for:", { role: user?.role, agentId });
      const data = await complaintService.getAllComplaints(agentId);
      console.log("Fetched complaints count:", data.length);
      setComplaints(data);
      if (data.length > 0 && !selectedComplaint) {
        setSelectedComplaint(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const stats = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      liked: complaints.filter(
        (c) =>
          c.resolutionFeedback?.toLowerCase() === "liked" ||
          c.resolutionFeedback?.toLowerCase() === "like",
      ).length,
      disliked: complaints.filter(
        (c) =>
          c.resolutionFeedback?.toLowerCase() === "disliked" ||
          c.resolutionFeedback?.toLowerCase() === "dislike",
      ).length,
      sentimentScore:
        complaints.filter((c) => c.resolutionFeedback).length > 0
          ? Math.round(
              (complaints.filter(
                (c) =>
                  c.resolutionFeedback?.toLowerCase() === "liked" ||
                  c.resolutionFeedback?.toLowerCase() === "like",
              ).length /
                complaints.filter((c) => c.resolutionFeedback).length) *
                100,
            )
          : 0,
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
    [complaints],
  );

  const filteredComplaints = useMemo(
    () =>
      complaints.filter(
        (c) =>
          c.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.complaintCategory
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(c.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.complaintText?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [complaints, searchQuery],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateStatus = async (id, newStatus, resolutionMessage = null) => {
    try {
      const result = await complaintService.updateStatus(
        id,
        newStatus,
        resolutionMessage,
      );
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...result } : c)),
      );
      if (selectedComplaint?.id === id) {
        setSelectedComplaint((prev) => ({ ...prev, ...result }));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
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
                {user?.role_id === "3" ? "My Tasks" : "Complaints"}
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {user?.role_id === "3"
                  ? `${user.specialization} Desk`
                  : "Intelligence Engine"}
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
                  s.bg,
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
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={clsx(
                  "w-full p-4 rounded-xl border text-left transition-all group relative overflow-hidden",
                  selectedComplaint?.id === c.id
                    ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20 shadow-md"
                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm",
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={clsx(
                      "text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md",
                      selectedComplaint?.id === c.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {String(c.id).substring(0, 8)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {formatTimeStr(c.created_at || c.timestamp)}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-xs mb-1 group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                  {c.complaintCategory || "Uncategorized"}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">
                  {c.license_plate || "NC-2245"} • {c.complaintText}
                </p>
                {c.assignedAgentName && (
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">
                    Agent: {c.assignedAgentName}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div
                      className={clsx(
                        "h-1.5 w-1.5 rounded-full animate-pulse",
                        c.status?.toLowerCase() === "resolved"
                          ? "bg-green-500"
                          : "bg-orange-500",
                      )}
                    />
                    <span
                      className={clsx(
                        "text-[9px] font-black uppercase",
                        c.status?.toLowerCase() === "resolved"
                          ? "text-green-600"
                          : "text-orange-600",
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(c.resolutionFeedback?.toLowerCase() === "liked" ||
                      c.resolutionFeedback?.toLowerCase() === "like") && (
                      <ThumbsUp size={12} className="text-green-500" />
                    )}
                    {(c.resolutionFeedback?.toLowerCase() === "disliked" ||
                      c.resolutionFeedback?.toLowerCase() === "dislike") && (
                      <ThumbsDown size={12} className="text-red-500" />
                    )}
                    {selectedComplaint?.id === c.id && (
                      <ArrowRight size={14} className="text-blue-500" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
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
                {selectedComplaint.status?.toLowerCase() !== "resolved" ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
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
                        {selectedComplaint.complaintCategory} Report
                      </span>
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
                      "{selectedComplaint.complaintText}"
                    </h2>

                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                      <div className="flex items-center space-x-8">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Confidence Score
                          </p>
                          <div
                            className={clsx(
                              "flex items-center px-3 py-1 rounded-full text-xs font-black uppercase",
                              selectedComplaint.confidenceScore > 0.7
                                ? "bg-green-50 text-green-600"
                                : "bg-slate-50 text-slate-600",
                            )}
                          >
                            <div
                              className={clsx(
                                "h-1.5 w-1.5 rounded-full mr-2",
                                selectedComplaint.confidenceScore > 0.7
                                  ? "bg-green-500"
                                  : "bg-slate-400",
                              )}
                            />
                            {Math.round(
                              (selectedComplaint.confidenceScore || 0) * 100,
                            )}
                            % Match
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Filed On
                          </p>
                          <p className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                            {formatDateStr(
                              selectedComplaint.created_at ||
                                selectedComplaint.timestamp,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
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
                        value: selectedComplaint.driver_name || "Kumara Perera",
                        icon: User,
                        color: "text-blue-500",
                        bg: "bg-blue-50",
                      },
                      {
                        label: "Vehicle Plate",
                        value: selectedComplaint.license_plate || "NC-2245",
                        icon: Bus,
                        color: "text-indigo-500",
                        bg: "bg-indigo-50",
                      },
                      {
                        label: "Speed at Incident",
                        value: `${selectedComplaint.busSpeedAtTime} km/h`,
                        icon: Activity,
                        color: "text-red-500",
                        bg: "bg-red-50",
                        sub: selectedComplaint.evidence || "Checking limits...",
                      },
                      {
                        label: "Route Information",
                        value: `Route ${selectedComplaint.route_number || "138"}`,
                        icon: MapPin,
                        color: "text-green-500",
                        bg: "bg-green-50",
                        sub:
                          selectedComplaint.route_name ||
                          "Route 138 - Colombo-Maharagama",
                      },
                      ...(selectedComplaint.resolutionMessage
                        ? [
                            {
                              label: "Resolution Outcome",
                              value: selectedComplaint.resolutionMessage,
                              icon: CheckCircle,
                              color: "text-emerald-500",
                              bg: "bg-emerald-50",
                              sub: `Resolved on ${formatDateStr(selectedComplaint.resolvedAt)}`,
                            },
                          ]
                        : []),
                      ...(selectedComplaint.resolutionFeedback
                        ? [
                            {
                              label: "Passenger Satisfaction",
                              value:
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "liked" ||
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "like"
                                  ? "Satisfied (Liked)"
                                  : "Unsatisfied (Disliked)",
                              icon:
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "liked" ||
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "like"
                                  ? ThumbsUp
                                  : ThumbsDown,
                              color:
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "liked" ||
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "like"
                                  ? "text-green-500"
                                  : "text-red-500",
                              bg:
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "liked" ||
                                selectedComplaint.resolutionFeedback?.toLowerCase() ===
                                  "like"
                                  ? "bg-green-50"
                                  : "bg-red-50",
                              sub: `Feedback received on ${formatDateStr(selectedComplaint.feedback_at)}`,
                            },
                          ]
                        : []),
                    ].map((t, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-start space-x-4",
                          t.label === "Resolution Outcome" && "col-span-2",
                        )}
                      >
                        <div className={clsx("p-3 rounded-2xl", t.bg, t.color)}>
                          <t.icon size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t.label}
                          </p>
                          <p className="text-[12px] font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter">
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
                    {selectedComplaint.assignedAgentName && (
                      <div className="col-span-2 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-center space-x-4">
                        <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                          <User size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                            Assigned Agent
                          </p>
                          <p className="text-lg font-black text-blue-900 leading-none uppercase tracking-tighter">
                            {selectedComplaint.assignedAgentName}
                          </p>
                        </div>
                      </div>
                    )}
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
                        selectedComplaint.busLocationAtTime?.latitude || 6.9271,
                        selectedComplaint.busLocationAtTime?.longitude ||
                          79.8612,
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
                          selectedComplaint.busLocationAtTime?.latitude ||
                            6.9271,
                          selectedComplaint.busLocationAtTime?.longitude ||
                            79.8612,
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
                          {(
                            selectedComplaint.busLocationAtTime?.latitude || 0
                          ).toFixed(4)}
                          ° N,{" "}
                          {(
                            selectedComplaint.busLocationAtTime?.longitude || 0
                          ).toFixed(4)}
                          ° E
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
      <ResolutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(msg) => updateStatus(selectedComplaint.id, "resolved", msg)}
        category={selectedComplaint?.complaintCategory}
      />
    </div>
  );
};

export default ComplaintAnalysis;
