const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * AuthService
 * Handles user registration, login, and permission checks.
 */
class AuthService {
  /**
   * Register a new user.
   * @param {Object} userData - name, email, password
   * @returns {Promise<Object>} Created user ID
   */
  static async register(userData) {
    const { name, email, password } = userData;

    const usersSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();
    if (!usersSnapshot.empty) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    // Default role: Passenger
    const rolesSnapshot = await db
      .collection("roles")
      .where("name", "==", "Passenger")
      .get();
    let roleId = null;
    if (!rolesSnapshot.empty) {
      roleId = rolesSnapshot.docs[0].id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = await db.collection("users").add({
      name,
      email,
      password: hashedPassword,
      role_id: roleId,
      created_at: new Date(),
    });

    return { id: newUserRef.id };
  }

  /**
   * Login a user and return a token with profile details.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Token and user info
   */
  static async login(email, password) {
    const usersSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();
    if (usersSnapshot.empty) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }

    const role = await this.getRoleDetails(user.role_id);

    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
        permissions: role.permissions,
      },
    };
  }

  /**
   * Get role name and permission slugs.
   * @param {string} roleId
   * @returns {Promise<Object>} Role details
   */
  static async getRoleDetails(roleId) {
    let roleName = null;
    let permissionSlugs = [];

    if (roleId) {
      const roleDoc = await db.collection("roles").doc(roleId).get();
      if (roleDoc.exists) {
        roleName = roleDoc.data().name;
      }

      const rpSnapshot = await db
        .collection("role_permissions")
        .where("role_id", "==", roleId)
        .get();
      if (!rpSnapshot.empty) {
        const permissionIds = rpSnapshot.docs.map(
          (doc) => doc.data().permission_id
        );
        if (permissionIds.length > 0) {
          const pSnapshot = await db.collection("permissions").get();
          pSnapshot.forEach((doc) => {
            if (permissionIds.includes(doc.id)) {
              permissionSlugs.push(doc.data().slug);
            }
          });
        }
      }
    }

    return { name: roleName, permissions: permissionSlugs };
  }

  /**
   * Get current user profile.
   * @param {string} userId
   * @returns {Promise<Object>} User profile
   */
  static async getMe(userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const userData = userDoc.data();
    const role = await this.getRoleDetails(userData.role_id);

    return {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: role.name,
      permissions: role.permissions,
    };
  }
}

module.exports = AuthService;
