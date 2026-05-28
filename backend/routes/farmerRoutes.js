const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const authMiddleware = require('../middleware/auth'); // Assuming you have auth middleware

// Routes for crop management
router.get('/crops', authMiddleware, farmerController.getCrops);
router.post('/crops', authMiddleware, farmerController.addCrop);
router.put('/crops/:id', authMiddleware, farmerController.updateCrop);
router.patch('/crops/:id/update-location', authMiddleware, farmerController.updateCropLocation);
router.delete('/crops/:id', authMiddleware, farmerController.deleteCrop);
router.delete('/crops/field/:fieldId', authMiddleware, farmerController.deleteCropsByFieldId);

// Routes for diseases
router.get('/diseases', authMiddleware, farmerController.getDiseases);
router.post('/diseases', authMiddleware, farmerController.addDisease);
router.put('/diseases/:id', authMiddleware, farmerController.updateDisease);
router.delete('/diseases/:id', authMiddleware, farmerController.deleteDisease);
router.delete('/diseases/crop/:cropId', authMiddleware, farmerController.deleteDiseasesByCropId);
router.delete('/diseases/field/:fieldId', authMiddleware, farmerController.deleteDiseasesByFieldId);

// Routes for locations
router.get('/locations', authMiddleware, farmerController.getLocations);
router.post('/locations', authMiddleware, farmerController.addLocation);
router.delete('/locations/:id', authMiddleware, farmerController.deleteLocation);

module.exports = router;
