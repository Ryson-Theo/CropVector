const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');

router.post('/suggestions', expertController.addSuggestion);
router.get('/suggestions/:sessionId', expertController.getSuggestionsForSession);

module.exports = router;

