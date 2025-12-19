const express = require('express');
const { getAllRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { getAllPermissions } = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/roles', protect, authorize('manage_roles'), getAllRoles);
router.post('/roles', protect, authorize('manage_roles'), createRole);
router.put('/roles/:id', protect, authorize('manage_roles'), updateRole);
router.delete('/roles/:id', protect, authorize('manage_roles'), deleteRole);

router.get('/permissions', protect, authorize('manage_roles'), getAllPermissions);

module.exports = router;
