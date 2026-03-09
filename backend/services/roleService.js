const db = require("../config/db");

/**
 * RoleService
 * Handles roles and their associations with permissions using MySQL.
 */
class RoleService {
  /**
   * Get all roles and their permissions.
   */
  static async getAllRoles() {
    const [roles] = await db.execute("SELECT * FROM roles");

    for (const role of roles) {
      const [permissions] = await db.execute(
        `SELECT p.* 
         FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE rp.role_id = ?`,
        [role.id],
      );
      // Serialize ids as strings so the frontend's .replace() and .includes() work correctly
      role.id = String(role.id);
      role.permissions = permissions.map((p) => ({
        ...p,
        id: String(p.id),
      }));
    }
    return roles;
  }

  /**
   * Create a new role and assign permissions.
   */
  static async createRole(data) {
    const { name, description, permissions } = data;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        "INSERT INTO roles (name, description, created_at) VALUES (?, ?, NOW())",
        [name, description || ""],
      );
      const roleId = result.insertId;

      if (permissions && permissions.length > 0) {
        for (const permId of permissions) {
          await connection.execute(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [roleId, Number(permId)],
          );
        }
      }

      await connection.commit();
      return { id: roleId, name, description };
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }

  /**
   * Update a role and its permissions.
   */
  static async updateRole(id, data) {
    const { name, description, permissions } = data;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        "UPDATE roles SET name = ?, description = ? WHERE id = ?",
        [name, description || "", id],
      );

      await connection.execute(
        "DELETE FROM role_permissions WHERE role_id = ?",
        [id],
      );

      if (permissions && permissions.length > 0) {
        for (const permId of permissions) {
          await connection.execute(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [id, Number(permId)],
          );
        }
      }

      await connection.commit();
      return { id, name, description };
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete a role and related permission associations.
   */
  static async deleteRole(id) {
    await db.execute("DELETE FROM roles WHERE id = ?", [id]);
  }

  /**
   * Get all master permissions.
   */
  static async getAllPermissions() {
    const [permissions] = await db.execute("SELECT * FROM permissions");
    // Serialize id as string to match what the frontend stores in formData.permissions[]
    return permissions.map((p) => ({ ...p, id: String(p.id) }));
  }
}

module.exports = RoleService;
