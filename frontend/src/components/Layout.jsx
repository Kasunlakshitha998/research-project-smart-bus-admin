import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Map, Bus, MessageSquare, Users, LogOut, TrendingUp, Shield } from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ icon: Icon, label, to }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center px-6 py-3 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
        >
            <Icon className="h-5 w-5 mr-3" />
            {label}
        </Link>
    );
};

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Bus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">SLTB Admin</h1>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <nav className="flex-1 mt-6 overflow-y-auto">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
                    <SidebarItem icon={Map} label="Route Management" to="/routes" />
                    <SidebarItem icon={Bus} label="Bus Management" to="/buses" />
                    <SidebarItem icon={Map} label="Live Map" to="/map" />
                    <SidebarItem icon={MessageSquare} label="Complaint Analysis" to="/complaints" />
                    <SidebarItem icon={TrendingUp} label="Passenger Prediction" to="/predictions" />

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Administration</p>
                        <SidebarItem icon={Users} label="User Management" to="/users" />
                        <SidebarItem icon={Shield} label="Roles & Permissions" to="/roles" />
                    </div>
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
