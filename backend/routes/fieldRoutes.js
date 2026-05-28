const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fieldController = require('../controllers/fieldController');
const poiController = require('../controllers/poiController');
const authMiddleware = require('../middleware/auth');

// Multer storage for disease photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/diseases/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// --- FIELD ROUTES ---
router.post('/fields', authMiddleware, fieldController.createField);
router.get('/fields', authMiddleware, fieldController.getFarmerFields);
router.get('/fields/near-location', authMiddleware, fieldController.getFieldsNearLocation);
router.get('/fields/:fieldId', authMiddleware, fieldController.getField);
router.patch('/fields/:fieldId', authMiddleware, fieldController.updateField);
router.patch('/fields/:fieldId/update-location', authMiddleware, fieldController.updateFieldLocation);
router.delete('/fields/:fieldId', authMiddleware, fieldController.deleteField);

// --- POI ROUTES ---
router.post('/fields/:fieldId/pois', authMiddleware, poiController.createPOI);
router.get('/fields/:fieldId/pois', authMiddleware, poiController.getFieldPOIs);
router.get('/fields/:fieldId/pois/heatmap', authMiddleware, poiController.getPOIHeatmap);
router.patch('/pois/:poiId', authMiddleware, poiController.updatePOI);
router.delete('/pois/:poiId', authMiddleware, poiController.deletePOI);

// --- DISEASE MARKING ---
// Wrap upload to catch errors but continue if photo fails
router.post('/fields/:fieldId/mark-disease', authMiddleware, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError || (err && err.message)) {      // Continue anyway - disease will be marked without photo
      req.file = null;
      req.photoError = err.message;
    }
    next();
  });
}, poiController.markDisease);

// Multer error handler for file upload failures
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum 5MB allowed.", photoSkipped: true });
    }
    return res.status(400).json({ error: err.message, photoSkipped: true });
  } else if (err && err.message) {
    // Custom error from fileFilter
    return res.status(400).json({ error: err.message, photoSkipped: true });
  }
  next();
});

module.exports = router;

