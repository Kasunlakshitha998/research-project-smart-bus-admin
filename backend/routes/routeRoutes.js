const express = require('express');
const { getAllRoutes, createRoute, updateRoute, deleteRoute } = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllRoutes);
router.post('/', protect, authorize('manage_routes'), createRoute);
router.put('/:id', protect, authorize('manage_routes'), updateRoute);
router.delete('/:id', protect, authorize('manage_routes'), deleteRoute);

module.exports = router;
