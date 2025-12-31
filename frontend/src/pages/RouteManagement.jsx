import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import routeService from '../services/routeService';
import Loading from '../components/Loading';

const RouteManagement = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoute, setCurrentRoute] = useState(null);
    const [formData, setFormData] = useState({
        route_number: '',
        route_name: '',
        start_point: '',
        end_point: '',
        distance: '',
        estimated_time: ''
    });

    const { user } = useAuth();

    const fetchRoutes = async () => {
        try {
            const data = await routeService.getAllRoutes();
            setRoutes(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching routes:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRoutes();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentRoute) {
                await routeService.updateRoute(currentRoute.id, formData);
            } else {
                await routeService.createRoute(formData);
            }
            fetchRoutes();
            closeModal();
        } catch (error) {
            console.error('Error saving route:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this route?')) {
            try {
                await routeService.deleteRoute(id);
                fetchRoutes();
            } catch (error) {
                console.error('Error deleting route:', error);
            }
        }
    };

    const openModal = (route = null) => {
        if (route) {
            setCurrentRoute(route);
            setFormData(route);
        } else {
            setCurrentRoute(null);
            setFormData({
                route_number: '',
                route_name: '',
                start_point: '',
                end_point: '',
                distance: '',
                estimated_time: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentRoute(null);
    };

    const filteredRoutes = routes.filter(route =>
        route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.route_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading />;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Route Management {user?.name && ` - ${user.name}`}</h1>
                    <p className="text-gray-500">Manage all bus routes in the system.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Route
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Route ID or Name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-3">Route ID</th>
                            <th className="px-6 py-3">Route Name</th>
                            <th className="px-6 py-3">Start Point</th>
                            <th className="px-6 py-3">End Point</th>
                            <th className="px-6 py-3">Distance (km)</th>
                            <th className="px-6 py-3">Est. Time</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRoutes.map((route) => (
                            <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{route.route_number}</td>
                                <td className="px-6 py-4">{route.route_name}</td>
                                <td className="px-6 py-4">{route.start_point}</td>
                                <td className="px-6 py-4">{route.end_point}</td>
                                <td className="px-6 py-4">{route.distance}</td>
                                <td className="px-6 py-4">{route.estimated_time}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openModal(route)} className="text-blue-600 hover:text-blue-800">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(route.id)} className="text-red-600 hover:text-red-800">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {currentRoute ? 'Edit Route' : 'Add New Route'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Route ID</label>
                                    <input
                                        type="text"
                                        name="route_number"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.route_number}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                                    <input
                                        type="text"
                                        name="route_name"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.route_name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Point</label>
                                    <input
                                        type="text"
                                        name="start_point"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.start_point}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Point</label>
                                    <input
                                        type="text"
                                        name="end_point"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.end_point}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                                    <input
                                        type="number"
                                        name="distance"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.distance}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time</label>
                                    <input
                                        type="text"
                                        name="estimated_time"
                                        placeholder="e.g. 2h 30m"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.estimated_time}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    {currentRoute ? 'Save Changes' : 'Create Route'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteManagement;
