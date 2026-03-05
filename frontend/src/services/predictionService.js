import api from "./api";

const predictionService = {
  getPredictions: async (routeId, range, startDate, endDate) => {
    const response = await api.get("/predictions", {
      params: { routeId, range, startDate, endDate },
    });
    return response.data;
  },
  applyBulkAssignments: async (assignments) => {
    const response = await api.post("/assignments/apply", { assignments });
    return response.data;
  },
};

export default predictionService;
