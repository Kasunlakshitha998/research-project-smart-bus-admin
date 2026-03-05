import api from "./api";

const complaintService = {
  getAllComplaints: async (agentId = null) => {
    const url = agentId ? `/complaints?agentId=${agentId}` : "/complaints";
    const response = await api.get(url);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/complaints/stats");
    return response.data;
  },
  updateStatus: async (id, status, resolutionMessage = null) => {
    const response = await api.patch(`/complaints/${id}/status`, {
      status,
      resolutionMessage,
    });
    return response.data;
  },
  createComplaint: async (complaintData) => {
    const response = await api.post("/complaints", complaintData);
    return response.data;
  },
};

export default complaintService;
