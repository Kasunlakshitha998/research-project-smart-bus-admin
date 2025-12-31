import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Shield, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import roleService from '../services/roleService';
import Loading from '../components/Loading';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] // Array of permission IDs
    });

    const { user } = useAuth();

    const fetchRoles = async () => {
        try {
            const data = await roleService.getAllRoles();
            setRoles(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching roles:', error);
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const data = await roleService.getAllPermissions();
            setPermissions(data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRoles();
        fetchPermissions();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePermissionToggle = (permissionId) => {
        const updatedPermissions = formData.permissions.includes(permissionId)
            ? formData.permissions.filter(id => id !== permissionId)
            : [...formData.permissions, permissionId];
        setFormData({ ...formData, permissions: updatedPermissions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentRole) {
                await roleService.updateRole(currentRole.id, formData);
            } else {
                await roleService.createRole(formData);
            }
            fetchRoles();
            closeModal();
        } catch (error) {
            console.error('Error saving role:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await roleService.deleteRole(id);
                fetchRoles();
            } catch (error) {
                console.error('Error deleting role:', error);
            }
        }
    };

    const openModal = (role = null) => {
        if (role) {
            setCurrentRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                permissions: role.permissions || []
            });
        } else {
            setCurrentRole(null);
            setFormData({
                name: '',
                description: '',
                permissions: []
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentRole(null);
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading />;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management {user?.name && ` - ${user.name}`}</h1>
                    <p className="text-gray-500">Define user roles and control access.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Role
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by role name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Permissions</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRoles.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                            <Shield className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{r.name}</div>
                                            <div className="text-sm text-gray-500">{r.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {r.permissions?.slice(0, 3).map(p => (
                                            <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium uppercase">
                                                {p.replace('_', ' ')}
                                            </span>
                                        ))}
                                        {r.permissions?.length > 3 && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                                                +{r.permissions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openModal(r)} className="text-blue-600 hover:text-blue-800">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800">
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
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {currentRole ? 'Edit Role' : 'Add New Role'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-60 overflow-y-auto">
                                    {permissions.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handlePermissionToggle(p.id)}
                                            className={`flex items-center p-2 rounded-md border cursor-pointer transition-all ${formData.permissions.includes(p.id)
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="text-xs font-medium uppercase">{p.id.replace('_', ' ')}</span>
                                            {formData.permissions.includes(p.id) && <Check className="w-3 h-3 ml-auto" />}
                                        </div>
                                    ))}
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
                                    {currentRole ? 'Save Changes' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
