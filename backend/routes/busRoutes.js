const express = require('express');
const { getAllBuses, createBus, updateBus, deleteBus } = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllBuses);
router.post('/', protect, authorize('manage_buses'), createBus);
router.put('/:id', protect, authorize('manage_buses'), updateBus);
router.delete('/:id', protect, authorize('manage_buses'), deleteBus);

module.exports = router;
