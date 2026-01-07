import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Info,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* LEFT: BRAND VISUAL PANE */}
      <div className="hidden lg:flex lg:w-3/5 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-110"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-linear-to-tr from-slate-900 via-slate-900/80 to-transparent" />

        {/* Branding Content */}
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center space-x-3 mb-8">
            {/* <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-white/10">
              <Bus className="h-8 w-8 text-white" />
            </div> */}
            <h1 className="text-3xl font-black text-white tracking-tighter">
              SMART <span className="text-blue-400">BUS</span>
            </h1>
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-[1.1] mb-6">
            Revolutionizing Urban <span className="text-blue-400">Transit</span>{" "}
            Intelligence.
          </h2>
          <p className="text-xl text-slate-300 font-medium leading-relaxed mb-8">
            Manage your fleet, predict demand, and enhance passenger experience
            through our advanced AI-driven administration portal.
          </p>

          <div className="flex flex-wrap gap-4">
            {[
              { icon: ShieldCheck, text: "Enterprise Security" },
              { icon: Info, text: "Real-time Analytics" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
              >
                <item.icon className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-white/90">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-widest">
          <span>© 2026 Smart Bus Admin</span>
          <span>v2.4.0 • Enterprise Edition</span>
        </div>
      </div>

      {/* RIGHT: LOGIN FORM PANE */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white relative">
        {/* Mobile Logo Visibility */}
        <div className="lg:hidden absolute top-12 left-1/2 -translate-x-1/2 flex items-center space-x-2">
          <Bus className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
            Smart Bus
          </span>
        </div>

        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
              Welcome Back
            </h3>
            <p className="text-slate-500 font-medium">
              Please enter your administrative credentials.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Email Address
              </label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@smartbus.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Forgot?
                </button>
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center space-x-3 text-red-700 animate-in shake duration-500">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 px-6 font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign into Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-12 text-center text-sm font-medium text-slate-500">
            Don't have an administrative account? <br />
            <button className="text-blue-600 font-bold hover:underline mt-1">
              Request System Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
