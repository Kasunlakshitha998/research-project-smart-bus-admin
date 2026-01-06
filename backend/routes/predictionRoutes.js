const express = require('express');
const { getPredictions, assignBuses } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getPredictions);
router.post('/assign', protect, assignBuses);

module.exports = router;
