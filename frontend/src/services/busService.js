import api from "./api";

const busService = {
  getAllBuses: async () => {
    const response = await api.get("/buses");
    return response.data;
  },
  createBus: async (busData) => {
    const response = await api.post("/buses", busData);
    return response.data;
  },
  updateBus: async (id, busData) => {
    const response = await api.put(`/buses/${id}`, busData);
    return response.data;
  },
  deleteBus: async (id) => {
    const response = await api.delete(`/buses/${id}`);
    return response.data;
  },
};

export default busService;
