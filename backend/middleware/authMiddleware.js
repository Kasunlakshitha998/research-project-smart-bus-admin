const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            console.log('Authorization check:', { user: req.user, requiredPermission });

            if (!req.user || !req.user.role_id) {
                console.error('User or role_id missing:', req.user);
                return res.status(403).json({ message: 'User role not found' });
            }

            // Check if role has permission
            const [results] = await db.query(`
        SELECT p.slug 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.slug = ?
      `, [req.user.role_id, requiredPermission]);

            console.log('Permission check result:', { role_id: req.user.role_id, requiredPermission, found: results.length > 0 });

            if (results.length > 0) {
                next();
            } else {
                return res.status(403).json({ message: 'Permission denied' });
            }
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    };
};
