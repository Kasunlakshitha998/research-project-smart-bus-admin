import { Users, Bus, Map, AlertTriangle, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const StatCard = ({ title, value, change, icon: Icon, color, gradient }) => (
    <div className={`p-6 rounded-2xl shadow-sm border border-white/20 relative overflow-hidden group transition-all hover:shadow-lg ${gradient}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon size={80} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white`}>
                    {change}
                </span>
            </div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="mt-1 text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    // Mock data for graphs
    const trafficData = [
        { name: 'Mon', passengers: 4000 },
        { name: 'Tue', passengers: 3000 },
        { name: 'Wed', passengers: 2000 },
        { name: 'Thu', passengers: 2780 },
        { name: 'Fri', passengers: 1890 },
        { name: 'Sat', passengers: 2390 },
        { name: 'Sun', passengers: 3490 },
    ];

    const categoryData = [
        { name: 'Cleanliness', value: 400 },
        { name: 'Driver Behavior', value: 300 },
        { name: 'Delay', value: 300 },
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

    const activities = [
        { id: 1, type: 'bus', message: 'Bus NC-1234 reached Kelaniya Station', time: '5 mins ago', icon: Bus, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 2, type: 'complaint', message: 'New complaint received for Route 120', time: '12 mins ago', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 3, type: 'prediction', message: 'High demand predicted for peak hours (Route 138)', time: '45 mins ago', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 4, type: 'user', message: 'New inspector account created', time: '1 hour ago', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Dashboard</h1>
                    <p className="text-gray-500 mt-1">Real-time overview of bus operations and passenger analytics.</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock size={16} />
                    <span>Last updated: Just now</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Total Passengers"
                    value="125,456"
                    change="+5.2%"
                    icon={Users}
                    gradient="bg-gradient-to-br from-blue-600 to-blue-400"
                />
                <StatCard
                    title="Active Buses"
                    value="48"
                    change="+2"
                    icon={Bus}
                    gradient="bg-gradient-to-br from-emerald-600 to-emerald-400"
                />
                <StatCard
                    title="Active Routes"
                    value="12"
                    change="Stable"
                    icon={Map}
                    gradient="bg-gradient-to-br from-indigo-600 to-indigo-400"
                />
                <StatCard
                    title="Pending Complaints"
                    value="05"
                    change="-2"
                    icon={AlertTriangle}
                    gradient="bg-gradient-to-br from-orange-600 to-orange-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Traffic Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Passenger Traffic Trend</h2>
                        <select className="text-sm border-none bg-gray-50 rounded-lg px-2 py-1 focus:ring-0">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <defs>
                                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="passengers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPass)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories Pie */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Complaints Breakdown</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                    <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center">
                        View all <ChevronRight size={16} />
                    </button>
                </div>
                <div className="space-y-6">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                            <div className={`p-2 rounded-xl ${activity.bg} ${activity.color}`}>
                                <activity.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{activity.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
