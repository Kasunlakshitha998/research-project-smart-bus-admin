import api from "./api";

const predictionService = {
  getPredictions: async (routeId, range, startDate, endDate) => {
    const response = await api.get("/predictions", {
      params: { routeId, range, startDate, endDate },
    });
    return response.data;
  },
  assignBuses: async (routeId, count) => {
    const response = await api.post("/predictions/assign", { routeId, count });
    return response.data;
  },
};

export default predictionService;
