const db = require("../config/db");

/**
 * RoleService
 * Handles roles and their associations with permissions.
 */
class RoleService {
  /**
   * Get all roles and their permissions.
   */
  static async getAllRoles() {
    const snapshot = await db.collection("roles").get();
    const roles = [];
    for (const doc of snapshot.docs) {
      const role = { id: doc.id, ...doc.data() };
      const rpSnapshot = await db
        .collection("role_permissions")
        .where("role_id", "==", doc.id)
        .get();
      const permissionIds = rpSnapshot.docs.map(
        (rpDoc) => rpDoc.data().permission_id
      );

      role.permissions = [];
      if (permissionIds.length > 0) {
        const pSnapshot = await db.collection("permissions").get();
        pSnapshot.forEach((pDoc) => {
          if (permissionIds.includes(pDoc.id)) {
            role.permissions.push({ id: pDoc.id, ...pDoc.data() });
          }
        });
      }
      roles.push(role);
    }
    return roles;
  }

  /**
   * Create a new role and assign permissions.
   */
  static async createRole(data) {
    const { name, description, permissions } = data;
    const newRole = { name, description, created_at: new Date() };
    const docRef = await db.collection("roles").add(newRole);
    const roleId = docRef.id;

    if (permissions && permissions.length > 0) {
      const batch = db.batch();
      permissions.forEach((permId) => {
        const rpRef = db.collection("role_permissions").doc();
        batch.set(rpRef, { role_id: roleId, permission_id: permId });
      });
      await batch.commit();
    }
    return { id: roleId, ...newRole };
  }

  /**
   * Update a role and its permissions.
   */
  static async updateRole(id, data) {
    const { name, description, permissions } = data;
    await db.collection("roles").doc(id).update({ name, description });

    const rpSnapshot = await db
      .collection("role_permissions")
      .where("role_id", "==", id)
      .get();
    const batch = db.batch();
    rpSnapshot.forEach((doc) => batch.delete(doc.ref));

    if (permissions && permissions.length > 0) {
      permissions.forEach((permId) => {
        const rpRef = db.collection("role_permissions").doc();
        batch.set(rpRef, { role_id: id, permission_id: permId });
      });
    }
    await batch.commit();
    return { id, name, description };
  }

  /**
   * Delete a role and related permission associations.
   */
  static async deleteRole(id) {
    await db.collection("roles").doc(id).delete();
    const rpSnapshot = await db
      .collection("role_permissions")
      .where("role_id", "==", id)
      .get();
    const batch = db.batch();
    rpSnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  /**
   * Get all master permissions.
   */
  static async getAllPermissions() {
    const snapshot = await db.collection("permissions").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = RoleService;
