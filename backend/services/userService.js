const db = require("../config/db");
const bcrypt = require("bcrypt");

/**
 * UserService
 * Handles administrative user management using MySQL.
 */
class UserService {
  /**
   * Get all users with their role names.
   */
  static async getAllUsers() {
    const [users] = await db.execute(`
      SELECT u.id, u.name, u.email, u.role_id, u.created_at, u.specialization, r.name as role_name 
      FROM system_users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    return users.map((u) => ({
      ...u,
      id: String(u.id),
      role_id: u.role_id != null ? String(u.role_id) : null,
    }));
  }

  /**
   * Create a new user with a specific role.
   */
  static async createUser(data) {
    const { name, email, password, role_id } = data;
    const [existing] = await db.execute(
      "SELECT id FROM system_users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO system_users (name, email, password, role_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [name, email, hashedPassword, role_id],
    );

    return {
      id: result.insertId,
      name,
      email,
      role_id,
    };
  }

  /**
   * Update user details.
   */
  static async updateUser(id, data) {
    const { name, email, role_id } = data;
    await db.execute(
      "UPDATE system_users SET name = ?, email = ?, role_id = ? WHERE id = ?",
      [name, email, role_id, id],
    );
    return { id, name, email, role_id };
  }

  /**
   * Delete a user.
   */
  static async deleteUser(id) {
    await db.execute("DELETE FROM system_users WHERE id = ?", [id]);
  }
}

module.exports = UserService;
