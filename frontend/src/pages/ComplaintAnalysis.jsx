import { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import complaintService from '../services/complaintService';
import Loading from '../components/Loading';

const ComplaintAnalysis = () => {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        by_category: []
    });
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    const fetchData = async () => {
        try {
            const [complaintsData, statsData] = await Promise.all([
                complaintService.getAllComplaints(),
                complaintService.getComplaintStats()
            ]);
            setComplaints(complaintsData);
            setStats(statsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await complaintService.updateComplaintStatus(id, newStatus);
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) return <Loading />;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Complaint Analysis {user?.name && ` - ${user.name}`}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center text-blue-600 mb-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Total Complaints</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center text-yellow-600 mb-2">
                        <Clock className="h-5 w-5 mr-2" />
                        <span className="font-medium">Pending</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center text-green-600 mb-2">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Resolved</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.resolved}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-6">Complaints by Category</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.by_category}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-6">Resolution Rate</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Resolved', value: stats.resolved },
                                        { name: 'Pending', value: stats.pending }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {COLORS.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">Recent Complaints</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Bus/Route</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Complaint</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {complaints.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{c.bus_plate || c.route_number}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                        {c.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate">{c.description}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        c.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {c.status === 'pending' && (
                                        <button 
                                            onClick={() => updateStatus(c.id, 'resolved')}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintAnalysis;
