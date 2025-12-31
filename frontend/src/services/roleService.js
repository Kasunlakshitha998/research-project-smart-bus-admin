import api from "./api";

const roleService = {
  getAllRoles: async () => {
    const response = await api.get("/roles");
    return response.data;
  },
  getAllPermissions: async () => {
    const response = await api.get("/permissions");
    return response.data;
  },
  createRole: async (roleData) => {
    const response = await api.post("/roles", roleData);
    return response.data;
  },
  updateRole: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },
  deleteRole: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};

export default roleService;
