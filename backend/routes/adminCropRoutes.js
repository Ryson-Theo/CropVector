const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminCropController');

// get all crops
router.get('/crops', adminController.getCrops);
// add a crop
router.post('/crops', adminController.addCrop);
// replace all crops
router.put('/crops', adminController.replaceCrops);
// delete a crop
router.delete('/crops/:index', adminController.deleteCrop);

module.exports = router;

