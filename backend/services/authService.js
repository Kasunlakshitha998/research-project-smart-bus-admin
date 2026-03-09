const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * AuthService
 * Handles user registration, login, and permission checks using MySQL.
 */
class AuthService {
  /**
   * Register a new user.
   * @param {Object} userData - name, email, password
   * @returns {Promise<Object>} Created user ID
   */
  static async register(userData) {
    const { name, email, password } = userData;

    const [users] = await db.execute(
      "SELECT id FROM system_users WHERE email = ?",
      [email],
    );
    if (users.length > 0) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    // Default role: Passenger
    const [roles] = await db.execute(
      "SELECT id FROM roles WHERE name = 'Passenger'",
    );
    let roleId = null;
    if (roles.length > 0) {
      roleId = roles[0].id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO system_users (name, email, password, role_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, email, hashedPassword, roleId],
    );

    return { id: result.insertId };
  }

  /**
   * Login a user and return a token with profile details.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Token and user info
   */
  static async login(email, password) {
    const [users] = await db.execute(
      "SELECT * FROM system_users WHERE email = ?",
      [email],
    );
    if (users.length === 0) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }

    const role = await this.getRoleDetails(user.role_id);

    const token = jwt.sign(
      { id: String(user.id), role_id: String(user.role_id) },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: role.name,
        role_id: String(user.role_id),
        specialization: user.specialization || null,
        permissions: role.permissions,
      },
    };
  }

  /**
   * Get role name and permission slugs.
   * @param {number|string} roleId
   * @returns {Promise<Object>} Role details
   */
  static async getRoleDetails(roleId) {
    let roleName = null;
    let permissionSlugs = [];

    if (roleId) {
      const [roles] = await db.execute("SELECT name FROM roles WHERE id = ?", [
        roleId,
      ]);
      if (roles.length > 0) {
        roleName = roles[0].name;

        const [permissions] = await db.execute(
          `SELECT p.slug 
           FROM role_permissions rp 
           JOIN permissions p ON rp.permission_id = p.id 
           WHERE rp.role_id = ?`,
          [roleId],
        );
        permissionSlugs = permissions.map((p) => p.slug);
      }
    }

    return { name: roleName, permissions: permissionSlugs };
  }

  /**
   * Get current user profile.
   * @param {number|string} userId
   * @returns {Promise<Object>} User profile
   */
  static async getMe(userId) {
    const [users] = await db.execute(
      "SELECT * FROM system_users WHERE id = ?",
      [userId],
    );
    if (users.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const userData = users[0];
    const role = await this.getRoleDetails(userData.role_id);

    return {
      id: String(userData.id),
      name: userData.name,
      email: userData.email,
      role: role.name,
      role_id: String(userData.role_id),
      specialization: userData.specialization || null,
      permissions: role.permissions,
    };
  }
}

module.exports = AuthService;
