import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import busService from "../services/busService";
import routeService from "../services/routeService";
import Loading from "../components/Loading";
import Pagination from "../components/Pagination";

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    capacity: "",
    status: "active",
    current_route_id: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { user } = useAuth();

  const fetchBuses = async () => {
    try {
      const data = await busService.getAllBuses();
      setBuses(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching buses:", error);
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBuses();
    fetchRoutes();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentBus) {
        await busService.updateBus(currentBus.id, formData);
      } else {
        await busService.createBus(formData);
      }
      fetchBuses();
      closeModal();
    } catch (error) {
      console.error("Error saving bus:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        await busService.deleteBus(id);
        fetchBuses();
      } catch (error) {
        console.error("Error deleting bus:", error);
      }
    }
  };

  const openModal = (bus = null) => {
    if (bus) {
      setCurrentBus(bus);
      setFormData({
        license_plate: bus.license_plate,
        model: bus.model,
        capacity: bus.capacity,
        status: bus.status,
        current_route_id: bus.current_route_id || "",
      });
    } else {
      setCurrentBus(null);
      setFormData({
        license_plate: "",
        model: "",
        capacity: "",
        status: "active",
        current_route_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBus(null);
  };

  const filteredBuses = buses.filter(
    (bus) =>
      bus.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bus.model && bus.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedBuses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBuses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBuses, currentPage]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bus Management {user?.name && ` - ${user.name}`}
          </h1>
          <p className="text-gray-500">Manage the bus fleet efficiently.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Bus
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by license plate, model..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
            <tr>
              <th className="px-6 py-3">Bus ID</th>
              <th className="px-6 py-3">License Plate</th>
              <th className="px-6 py-3">Model</th>
              <th className="px-6 py-3">Capacity</th>
              <th className="px-6 py-3">Assigned Route</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedBuses.map((bus) => (
              <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  B{String(bus.id).padStart(3, "0")}
                </td>
                <td className="px-6 py-4">{bus.license_plate}</td>
                <td className="px-6 py-4">{bus.model}</td>
                <td className="px-6 py-4">{bus.capacity}</td>
                <td className="px-6 py-4">{bus.route_number || "-"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      bus.status
                    )}`}
                  >
                    {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openModal(bus)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bus.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedBuses.length === 0 && filteredBuses.length > 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No buses found on this page.
                </td>
              </tr>
            )}
            {filteredBuses.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No buses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {currentBus ? "Edit Bus" : "Add New Bus"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.license_plate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.model}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Route
                </label>
                <select
                  name="current_route_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={formData.current_route_id}
                  onChange={handleInputChange}
                >
                  <option value="">None</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.route_number} - {route.route_name}
                    </option>
                  ))}
                </select>
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
                  {currentBus ? "Save Changes" : "Add Bus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusManagement;
