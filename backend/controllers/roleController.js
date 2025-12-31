const RoleService = require("../services/roleService");

/**
 * Role Controller
 * Handles management of roles and their permissions.
 */

/**
 * Get all roles and their assigned permissions.
 */
exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await RoleService.getAllRoles();
    // Frontend expects the array directly
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new system role.
 */
exports.createRole = async (req, res, next) => {
  try {
    const role = await RoleService.createRole(req.body);
    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    next(error);
  }
};

/**
 * Update role and permission mapping.
 */
exports.updateRole = async (req, res, next) => {
  try {
    const role = await RoleService.updateRole(req.params.id, req.body);
    res.json({ message: "Role updated successfully", role });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a system role.
 */
exports.deleteRole = async (req, res, next) => {
  try {
    await RoleService.deleteRole(req.params.id);
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    next(error);
  }
};
