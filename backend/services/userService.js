const db = require("../config/db");
const bcrypt = require("bcrypt");

/**
 * UserService
 * Handles administrative user management.
 */
class UserService {
  /**
   * Get all users with their role names.
   */
  static async getAllUsers() {
    const snapshot = await db
      .collection("system_users")
      .orderBy("created_at", "desc")
      .get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (users.length > 0) {
      const roleSnapshot = await db.collection("roles").get();
      const roleMap = {};
      roleSnapshot.forEach((doc) => (roleMap[doc.id] = doc.data()));

      users.forEach((u) => {
        if (u.role_id && roleMap[u.role_id])
          u.role_name = roleMap[u.role_id].name;
      });
    }
    return users;
  }

  /**
   * Create a new user with a specific role.
   */
  static async createUser(data) {
    const { name, email, password, role_id } = data;
    const usersSnapshot = await db
      .collection("system_users")
      .where("email", "==", email)
      .get();
    if (!usersSnapshot.empty) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role_id,
      created_at: new Date(),
    };
    const docRef = await db.collection("system_users").add(newUser);
    return { id: docRef.id, ...newUser };
  }

  /**
   * Update user details.
   */
  static async updateUser(id, data) {
    const { name, email, role_id } = data;
    await db
      .collection("system_users")
      .doc(id)
      .update({ name, email, role_id });
    return { id, name, email, role_id };
  }

  /**
   * Delete a user.
   */
  static async deleteUser(id) {
    await db.collection("system_users").doc(id).delete();
  }
}

module.exports = UserService;
