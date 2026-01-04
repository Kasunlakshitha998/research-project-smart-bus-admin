const UserService = require("../services/userService");

/**
 * User Controller
 * Handles administrative management of users.
 */

/**
 * Fetch all users with role details.
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user account.
 */
exports.createUser = async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing user profile and role.
 */
exports.updateUser = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a user account.
 */
exports.deleteUser = async (req, res, next) => {
  try {
    await UserService.deleteUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
