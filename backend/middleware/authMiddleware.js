const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      console.log("Authorization check:", {
        user: req.user,
        requiredPermission,
      });

      if (!req.user || !req.user.role_id) {
        console.error("User or role_id missing:", req.user);
        return res.status(403).json({ message: "User role not found" });
      }

      // Hardcoded check for Admin role_id '1' as requested
      if (req.user.role_id.toString() === "1") {
        if (["manage_users", "manage_roles"].includes(requiredPermission)) {
          console.log("Admin permission granted via role_id check");
          return next();
        }
      }

      // Check if role has permission in Firestore
      const permissionsSnapshot = await db
        .collection("permissions")
        .where("slug", "==", requiredPermission)
        .get();

      if (permissionsSnapshot.empty) {
        console.error("Permission slug not found:", requiredPermission);
        return res.status(403).json({ message: "Permission denied" });
      }

      const permissionId = permissionsSnapshot.docs[0].id;

      const rpSnapshot = await db
        .collection("role_permissions")
        .where("role_id", "==", req.user.role_id.toString())
        .where("permission_id", "==", permissionId)
        .get();

      console.log("Permission check result:", {
        role_id: req.user.role_id,
        requiredPermission,
        found: !rpSnapshot.empty,
      });

      if (!rpSnapshot.empty) {
        next();
      } else {
        return res.status(403).json({ message: "Permission denied" });
      }
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};
