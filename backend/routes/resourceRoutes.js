// backend/routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController.js');

router.get('/resources', resourceController.getResources);

module.exports = router;
