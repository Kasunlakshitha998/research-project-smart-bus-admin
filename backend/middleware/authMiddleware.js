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

      // Hardcoded check for Admin role_id '1'
      if (req.user.role_id.toString() === "1") {
        if (
          ["manage_users", "manage_roles", "manage_allocations"].includes(
            requiredPermission,
          )
        ) {
          console.log("Admin permission granted via role_id check");
          return next();
        }
      }

      // Check if role has permission via MySQL
      const [permRows] = await db.execute(
        "SELECT id FROM permissions WHERE slug = ?",
        [requiredPermission],
      );

      if (permRows.length === 0) {
        console.error("Permission slug not found:", requiredPermission);
        return res.status(403).json({ message: "Permission denied" });
      }

      const permissionId = permRows[0].id;

      const [rpRows] = await db.execute(
        "SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?",
        [req.user.role_id, permissionId],
      );

      console.log("Permission check result:", {
        role_id: req.user.role_id,
        requiredPermission,
        found: rpRows.length > 0,
      });

      if (rpRows.length > 0) {
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
