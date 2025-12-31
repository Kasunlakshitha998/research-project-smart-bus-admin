const RoleService = require("../services/roleService");

/**
 * Permission Controller
 * Simple controller to fetch master permission list.
 */

/**
 * Get all registered system permissions.
 */
exports.getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await RoleService.getAllPermissions();
    // Frontend expects the array directly
    res.json(permissions);
  } catch (error) {
    next(error);
  }
};
