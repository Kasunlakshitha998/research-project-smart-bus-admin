const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Default role: Passenger
        const [passengerRole] = await db.query('SELECT id FROM roles WHERE name = "Passenger"');
        const roleId = passengerRole[0]?.id;

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roleId]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Get role name and permissions
        const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [user.role_id]);
        const roleName = roles[0]?.name;

        const [permissions] = await db.query(`
      SELECT p.slug FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `, [user.role_id]);

        const permissionSlugs = permissions.map(p => p.slug);

        const token = jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        console.log('User data:', { id: user.id, role_id: user.role_id });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
                permissions: permissionSlugs
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await db.query(`
      SELECT u.id, u.name, u.email, r.name as role 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const [permissions] = await db.query(`
      SELECT p.slug FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `, [req.user.role_id]);

        user.permissions = permissions.map(p => p.slug);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
