const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/auth');

// --- ALERT ROUTES ---

// Create alert (Expert only)
router.post('/alerts/create', authMiddleware, alertController.createAlert);

// Create test alerts (Admin only - for demo/testing)
router.post('/alerts/test/create', authMiddleware, alertController.createTestAlerts);

// Get alerts created by logged-in expert - MUST COME BEFORE /:alertId
router.get('/alerts/my/alerts', authMiddleware, alertController.getExpertAlerts);

// Get alert statistics (Admin only)
router.get('/alerts/stats/all', authMiddleware, alertController.getAlertStats);

// Get alerts status (For debugging - admin only)
router.get('/alerts/debug/status', authMiddleware, alertController.getAlertsStatus);

// Delete all alerts (Admin only - for testing/reset)
router.delete('/alerts/test/delete-all', authMiddleware, alertController.deleteAllAlerts);

// Get all active alerts (Farmers, Admins, Experts, Users)
router.get('/alerts', alertController.getAlerts);

// Get single alert details
router.get('/alerts/:alertId', alertController.getAlert);

// Update alert (Expert only - creator)
router.patch('/alerts/:alertId', authMiddleware, alertController.updateAlert);

// Deactivate alert (Expert creator or Admin)
router.patch('/alerts/:alertId/deactivate', authMiddleware, alertController.deactivateAlert);

// Delete alert (Expert creator or Admin)
router.delete('/alerts/:alertId', authMiddleware, alertController.deleteAlert);

// Increment alert views
router.put('/alerts/:alertId/views', alertController.incrementAlertViews);

module.exports = router;

