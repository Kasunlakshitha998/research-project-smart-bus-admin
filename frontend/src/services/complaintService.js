import api from "./api";

const complaintService = {
  getAllComplaints: async () => {
    const response = await api.get("/complaints");
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/complaints/stats");
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/complaints/${id}/status`, { status });
    return response.data;
  },
};

export default complaintService;
