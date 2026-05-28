const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Create a new report (consultation request or issue report)
router.post('/', reportController.createReport);

// Expert responds to a consultation (MUST come before /:id routes)
router.post('/:id/respond', reportController.respondToConsultation);

// Get consultation reports for a specific expert (MUST come before generic /by/:id)
router.get('/expert/:expertId', reportController.getReportsByExpert);

// Get reports by reporter id
router.get('/by/:id', reportController.getReportsByReporter);

// Admin: get all reports (optionally filter by ?type=consultation)
router.get('/', reportController.getReports);

// Update report status (admin/expert)
router.patch('/:id', reportController.updateReportStatus);

module.exports = router;

