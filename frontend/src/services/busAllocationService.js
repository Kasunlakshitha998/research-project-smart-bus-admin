import api from "./api";

const busAllocationService = {
  getAllocations: async (date, routeId = "all") => {
    const response = await api.get("/bus-allocation", {
      params: { date, routeId },
    });
    return response.data;
  },
  saveOverride: async (routeId, date, overrideBuses) => {
    const response = await api.post("/bus-allocation/override", {
      routeId,
      date,
      overrideBuses,
    });
    return response.data;
  },
  getAssignmentPreview: async (routeId, neededCount) => {
    const response = await api.get("/bus-allocation/preview", {
      params: { routeId, neededCount },
    });
    return response.data;
  },
};

export default busAllocationService;
