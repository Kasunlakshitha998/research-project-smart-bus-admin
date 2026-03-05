import { useState, useEffect } from "react";
import {
  MessageSquare,
  Bus,
  MapPin,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import busService from "../services/busService";
import routeService from "../services/routeService";
import complaintService from "../services/complaintService";
import clsx from "clsx";

const ComplaintForm = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    busId: "",
    complaintText: "",
    passengerId: "TEST_USER_001", // Default for testing
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busData, routeData] = await Promise.all([
          busService.getAllBuses(),
          routeService.getAllRoutes(),
        ]);
        setBuses(busData);
        setRoutes(routeData);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        setMessage({
          type: "error",
          text: "Failed to load bus and route information.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.busId || !formData.complaintText) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await complaintService.createComplaint(formData);
      setMessage({
        type: "success",
        text: "Complaint submitted successfully! AI is analyzing it now.",
      });
      setFormData({ ...formData, complaintText: "" });

      // Auto redirect to complaints dashboard after 2 seconds
      setTimeout(() => {
        navigate("/complaints");
      }, 2000);
    } catch (error) {
      console.error("Submission failed:", error);
      setMessage({
        type: "error",
        text: "Failed to submit complaint. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">
          Initializing Complaint Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <MessageSquare className="h-8 w-8 mr-3 text-blue-600" />
            Submit Feedback
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Help us improve our service by reporting incidents or providing
            suggestions.
          </p>
        </div>
        <button
          onClick={() => navigate("/complaints")}
          className="flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            <div className="p-8 space-y-6">
              {/* Bus Selection */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Vehicle Selection
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <Bus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <select
                      value={formData.busId}
                      onChange={(e) =>
                        setFormData({ ...formData, busId: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none font-bold text-slate-700"
                    >
                      <option value="">Select Bus / Plate</option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.bus_number} ({bus.license_plate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Complaint Text */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Incident Details
                </label>
                <div className="relative group">
                  <textarea
                    placeholder="Describe what happened... (e.g. The bus was driving too fast near the junction)"
                    value={formData.complaintText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        complaintText: e.target.value,
                      })
                    }
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-40 font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>

              {/* Status Message */}
              {message.text && (
                <div
                  className={clsx(
                    "p-4 rounded-2xl flex items-start space-x-3 border",
                    message.type === "success"
                      ? "bg-green-50 border-green-100 text-green-700"
                      : "bg-red-50 border-red-100 text-red-700",
                  )}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <p className="text-sm font-bold">{message.text}</p>
                </div>
              )}
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 transition-all flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Shield className="h-32 w-32" />
            </div>
            <h3 className="text-xl font-black mb-4 relative z-10">
              AI-Powered Validation
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6 relative z-10">
              Our system automatically analyzes your feedback using NLP and
              matches it with real-time bus telemetry data for instant
              verification.
            </p>
            <ul className="space-y-4 relative z-10">
              {[
                { label: "Automatic Categorization", icon: CheckCircle2 },
                { label: "Speed Limit Check", icon: CheckCircle2 },
                { label: "Route Compliance", icon: CheckCircle2 },
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center text-xs font-bold uppercase tracking-wider"
                >
                  <item.icon className="h-4 w-4 mr-2 text-blue-300" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Sample Scenarios
            </h4>
            <div className="space-y-3">
              {[
                "The bus was driving very fast.",
                "Driver missed the stop.",
                "The bus is very dirty inside.",
              ].map((sample, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setFormData({ ...formData, complaintText: sample })
                  }
                  className="w-full text-left p-3 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-slate-200 transition-all"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;
