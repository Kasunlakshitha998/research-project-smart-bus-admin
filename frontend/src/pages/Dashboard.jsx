import { Users, Bus, Map, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className={change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                {change}
            </span>
            <span className="ml-2 text-gray-400">from last month</span>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Passengers"
                    value="125,456"
                    change="+5.2%"
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Buses"
                    value="48"
                    change="+2"
                    icon={Bus}
                    color="bg-green-500"
                />
                <StatCard
                    title="Active Routes"
                    value="12"
                    change="0"
                    icon={Map}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Pending Complaints"
                    value="5"
                    change="-2"
                    icon={AlertTriangle}
                    color="bg-orange-500"
                />
            </div>

            {/* Add more sections like charts or recent activity here */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="text-gray-500 text-center py-8">
                    Chart placeholder (Passenger Trends)
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
