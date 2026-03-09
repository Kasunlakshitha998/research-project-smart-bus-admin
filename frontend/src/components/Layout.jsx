import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Map,
  Bus,
  MessageSquare,
  Users,
  LogOut,
  TrendingUp,
  Shield,
  Bell,
  Search,
  User,
  Menu,
  X,
  ChevronRight,
  Activity,
  FileText,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

// eslint-disable-next-line no-unused-vars
const SidebarItem = ({ icon: Icon, label, to, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <div className="relative">
      <Link
        to={to}
        onClick={onClick}
        className={clsx(
          "flex items-center px-6 py-4 text-sm transition-all duration-300 group",
          isActive
            ? "active-curve"
            : "text-white/90 hover:text-white hover:bg-white/5 mx-4 rounded-xl",
        )}
      >
        <Icon className="h-5 w-5 mr-3 transition-colors" />
        <span className="truncate">{label}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
        )}
      </Link>
    </div>
  );
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const path = location.pathname.split("/")[1];
    switch (path) {
      case "dashboard":
        return "Dashboard Overview";
      case "routes":
        return "Route Management";
      case "buses":
        return "Bus Fleet";
      case "map":
        return "Real-time Tracking";
      case "complaints":
        return "Passenger Feedback";
      case "predictions":
        return "Demand Forecasts";
      case "drivers":
        return "Driver Analytics";
      case "investigation-notes":
        return "Investigation Notes";
      case "users":
        return "User Directory";
      case "roles":
        return "Access Control";
      default:
        return "Project Smart Bus";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 bg-[#0c2c57] w-72 z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-8 flex items-center space-x-3 mb-4">
          <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Smart Bus
            </h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none">
              Management
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="px-8 mt-4 mb-3">
            <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em]">
              Dashboard
            </p>
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            to="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="px-8 mt-8 mb-3">
            <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em]">
              Operations
            </p>
          </div>
          {user?.role_id !== "3" && (
            <>
              <SidebarItem
                icon={Map}
                label="Routes"
                to="/routes"
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                icon={Bus}
                label="Bus Fleet"
                to="/buses"
                onClick={() => setIsSidebarOpen(false)}
              />
            </>
          )}
          {user?.role_id !== "3" && (
            <>
              <SidebarItem
                icon={Map}
                label="Live Map"
                to="/map"
                onClick={() => setIsSidebarOpen(false)}
              />
            </>
          )}
          <SidebarItem
            icon={MessageSquare}
            label="Complaints"
            to="/complaints"
            onClick={() => setIsSidebarOpen(false)}
          />
          {user?.role_id !== "3" && (
            <>
              <SidebarItem
                icon={TrendingUp}
                label="Predictions"
                to="/predictions"
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                icon={Activity}
                label="Driver Analytics"
                to="/drivers"
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                icon={FileText}
                label="Investigation Notes"
                to="/investigation-notes"
                onClick={() => setIsSidebarOpen(false)}
              />
            </>
          )}

          {user?.role_id !== "3" && (
            <>
              <div className="px-8 mt-8 mb-3">
                <p className="text-[10px] font-bold text-blue-200/50 uppercase tracking-[0.2em]">
                  Admin
                </p>
              </div>
              <SidebarItem
                icon={Users}
                label="Users"
                to="/users"
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarItem
                icon={Shield}
                label="Roles"
                to="/roles"
                onClick={() => setIsSidebarOpen(false)}
              />
            </>
          )}
        </nav>

        <div className="px-6 py-2 shadow border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-5 py-3 text-sm font-semibold text-blue-200/60 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
          >
            <LogOut className="h-5 w-5 mr-3 transition-colors group-hover:text-red-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 relative z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {getPageTitle()}
              </h2>
              <div className="flex items-center text-xs text-gray-400 mt-0.5">
                <span>Control Panel</span>
                <ChevronRight size={12} className="mx-1" />
                <span className="text-gray-600 font-medium">
                  {getPageTitle()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-5">
            <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search everything..."
                className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-gray-600 placeholder:text-gray-400"
              />
            </div>

            <div className="h-10 w-px bg-gray-100 mx-2" />

            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
              <Bell size={22} />
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center space-x-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  {user?.role || "Administrator"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-50 transition-all">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 bg-[#f8fafc]">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
