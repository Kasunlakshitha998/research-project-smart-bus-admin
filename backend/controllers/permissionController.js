const db = require('../config/db');

exports.getAllPermissions = async (req, res) => {
    try {
        const [permissions] = await db.query('SELECT * FROM permissions');
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
