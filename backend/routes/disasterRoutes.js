const express = require('express');
const router = express.Router();
const disasterController = require('../controllers/disasterController');
const authMiddleware = require('../middleware/auth');

// Farmer creates disaster
router.post('/', authMiddleware, disasterController.createDisaster);

// Farmer updates own disaster
router.patch('/:id', authMiddleware, disasterController.updateDisaster);

// Farmer gets their disasters
router.get('/mine', authMiddleware, disasterController.getMyDisasters);

// Admin/Expert gets privacy-preserving public disasters
router.get('/public', authMiddleware, disasterController.getPublicDisasters);

// Farmer deletes own disaster
router.delete('/:id', authMiddleware, disasterController.deleteDisaster);

module.exports = router;

