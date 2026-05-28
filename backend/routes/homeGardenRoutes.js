const express = require('express');
const router = express.Router();
const homeGardenController = require('../controllers/homeGardenController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get user's home garden data
router.get('/', homeGardenController.getHomeGarden);

// Save/update all home garden data
router.post('/', homeGardenController.saveHomeGarden);

// Update specific section
router.put('/:section', homeGardenController.updateHomeGardenSection);

// Delete all home garden data (reset)
router.delete('/', homeGardenController.deleteHomeGarden);

module.exports = router;
