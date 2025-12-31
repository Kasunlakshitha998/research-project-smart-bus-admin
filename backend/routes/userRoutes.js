const express = require('express');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('manage_users'), getAllUsers);
router.post('/', protect, authorize('manage_users'), createUser);
router.put('/:id', protect, authorize('manage_users'), updateUser);
router.delete('/:id', protect, authorize('manage_users'), deleteUser);

module.exports = router;
