const Alert = require('../models/Alert');
const User = require('../models/User');

// Map alert types to AI specifications and goals
const alertMappings = {
  'Outbreak': {
    aiSpecification: 'Technical Bio-Security Bulletin',
    goal: 'Stop a disease from spreading.'
  },
  'Weather': {
    aiSpecification: 'Agronomic Risk Analysis',
    goal: 'Prevent crop loss from frost/flood.'
  },
  'Market': {
    aiSpecification: 'Economic Intelligence Report',
    goal: 'Help the farmer make more money.'
  },
  'Task': {
    aiSpecification: 'Regional Management Protocol',
    goal: 'Get everyone to spray/fertilize at once.'
  }
};

// create a broadcast alert
exports.createAlert = async (req, res) => {
  try {
    const { alertType, title, content, region, affectedAreas, severity, expiresAt } = req.body;
    const expertId = req.user?.id || req.user?.userId;

    if (!expertId) return res.status(401).json({ error: "Unauthorized" });

    // check if user is expert
    const expert = await User.findById(expertId);
    if (expert?.role !== 'expert') {
      return res.status(403).json({ error: "Only experts can create broadcast alerts" });
    }

    // check alert type is valid
    if (!alertMappings[alertType]) {
      return res.status(400).json({ 
        error: "Invalid alert type. Use: Outbreak, Weather, Market, or Task" 
      });
    }

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const mapping = alertMappings[alertType];

    const alert = new Alert({
      expertId,
      expertName: expert.fullName,
      expertEmail: expert.email,
      alertType,
      title,
      content,
      aiSpecification: mapping.aiSpecification,
      goal: mapping.goal,
      region: region || 'All Regions',
      affectedAreas: affectedAreas || [],
      severity: severity || 'Medium',
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    });

    await alert.save();
    res.status(201).json({ 
      message: "Alert created successfully", 
      alert 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create alert" });
  }
};

// get all active alerts
exports.getAlerts = async (req, res) => {
  try {
    const { alertType, severity, region, includeExpired } = req.query;
    let filter = { 
      isActive: true
    };
    
    // Show non-expired alerts by default, or all alerts if includeExpired is true
    if (!includeExpired || includeExpired === 'false') {
      filter.expiresAt = { $gt: new Date() }; // Only non-expired alerts
    }

    if (alertType) {
      filter.alertType = alertType;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (region) {
      filter.region = { $regex: region, $options: 'i' };
    }

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .populate('expertId', 'fullName email')
      .lean();

    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// get single alert details

exports.getAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const alert = await Alert.findById(alertId)
      .populate('expertId', 'fullName email profilePic');

    if (!alert) return res.status(404).json({ error: "Alert not found" });

    // Increment view count and track viewer
    if (userId) {
      const userIdStr = userId.toString();
      if (!alert.viewedBy.some(id => id.toString() === userIdStr)) {
        alert.viewedBy.push(userId);
        alert.views = (alert.views || 0) + 1;
        await alert.save();
      }
    } else {
      // For unauthenticated users, always increment
      alert.views = (alert.views || 0) + 1;
      await alert.save();
    }

    res.status(200).json(alert);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alert" });
  }
};

/**
 * GET ALERTS BY EXPERT (For expert dashboard)
 */
exports.getExpertAlerts = async (req, res) => {
  try {
    const expertId = req.user?.id || req.user?.userId;

    if (!expertId) return res.status(401).json({ error: "Unauthorized" });

    const expert = await User.findById(expertId);
    if (expert?.role !== 'expert') {
      return res.status(403).json({ error: "Only experts can view their alerts" });
    }

    const alerts = await Alert.find({ expertId })
      .sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

/**
 * UPDATE ALERT (Expert only - who created it)
 */
exports.updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { title, content, severity, region, affectedAreas } = req.body;
    const expertId = req.user?.id || req.user?.userId;

    if (!expertId) return res.status(401).json({ error: "Unauthorized" });

    const alert = await Alert.findById(alertId);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    // Only creator can update
    if (alert.expertId.toString() !== expertId) {
      return res.status(403).json({ error: "Can only update your own alerts" });
    }

    if (title) alert.title = title;
    if (content) alert.content = content;
    if (severity) alert.severity = severity;
    if (region) alert.region = region;
    if (affectedAreas) alert.affectedAreas = affectedAreas;
    alert.updatedAt = new Date();

    await alert.save();
    res.status(200).json({ message: "Alert updated successfully", alert });
  } catch (err) {
    res.status(500).json({ error: "Failed to update alert" });
  }
};

/**
 * DEACTIVATE ALERT (Expert who created it or admin)
 */
exports.deactivateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    const alert = await Alert.findById(alertId);

    if (!alert) return res.status(404).json({ error: "Alert not found" });

    // Only creator or admin can deactivate
    if (alert.expertId.toString() !== userId && user?.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to deactivate this alert" });
    }

    alert.isActive = false;
    await alert.save();
    res.status(200).json({ message: "Alert deactivated successfully", alert });
  } catch (err) {
    res.status(500).json({ error: "Failed to deactivate alert" });
  }
};

/**
 * DELETE ALERT (Expert who created it or admin)
 */
exports.deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    const alert = await Alert.findById(alertId);

    if (!alert) return res.status(404).json({ error: "Alert not found" });

    // Only creator or admin can delete
    if (alert.expertId.toString() !== userId && user?.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to delete this alert" });
    }

    await Alert.findByIdAndDelete(alertId);
    res.status(200).json({ message: "Alert deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete alert" });
  }
};

/**
 * GET ALERT STATISTICS (Admin only)
 */
exports.getAlertStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId);

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can view alert statistics" });
    }

    const totalAlerts = await Alert.countDocuments();
    const activeAlerts = await Alert.countDocuments({ isActive: true, expiresAt: { $gt: new Date() } });
    
    const alertsByType = await Alert.aggregate([
      { $group: { _id: "$alertType", count: { $sum: 1 } } }
    ]);

    const bySeverity = await Alert.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      totalAlerts,
      activeAlerts,
      alertsByType,
      bySeverity
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
/**
 * INCREMENT ALERT VIEWS
 */
exports.incrementAlertViews = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.status(200).json(alert);
  } catch (err) {
    res.status(500).json({ error: "Failed to increment views" });
  }
};

/**
 * CREATE TEST ALERTS (For development/demo purposes)
 */
exports.createTestAlerts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId);
    
    // Only admins can create test data
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can create test alerts" });
    }

    // Check if test alerts already exist
    const existingCount = await Alert.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ 
        message: "Test alerts already exist", 
        count: existingCount,
        info: "To reset, delete existing alerts first or use a different admin account"
      });
    }

    const testAlerts = [
      {
        expertId: userId,
        expertName: "System Admin",
        expertEmail: user.email,
        expertRole: 'admin',
        alertType: 'Outbreak',
        title: 'Tomato Leaf Blight Alert - Northern Region',
        content: 'High incidence of early blight detected in tomato crops across northern districts. Recommended immediate action: Apply preventive fungicides (Mancozeb 75% WP) at 2.5 kg/ha. Remove infected leaves and improve air circulation.',
        aiSpecification: 'Technical Bio-Security Bulletin',
        goal: 'Stop disease from spreading to neighboring farms',
        region: 'North Region',
        affectedAreas: ['Punjab', 'Himachal Pradesh', 'Jammu & Kashmir'],
        severity: 'High',
        isActive: true,
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      },
      {
        expertId: userId,
        expertName: "System Admin",
        expertEmail: user.email,
        expertRole: 'admin',
        alertType: 'Weather',
        title: 'Heavy Rainfall Warning - Western Regions',
        content: 'IMD forecasts 40-60mm rainfall expected in western regions over next 48 hours. Risk of waterlogging and soil erosion. Recommendations: Create proper drainage channels, postpone irrigation schedules, harvest mature crops if possible.',
        aiSpecification: 'Agronomic Risk Analysis',
        goal: 'Prevent crop loss from flood',
        region: 'West Region',
        affectedAreas: ['Gujarat', 'Maharashtra', 'Rajasthan'],
        severity: 'Critical',
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      {
        expertId: userId,
        expertName: "System Admin",
        expertEmail: user.email,
        expertRole: 'admin',
        alertType: 'Market',
        title: 'Paddy Market Price Surge',
        content: 'Paddy prices increased by 12% in APMC markets due to lower arrivals. Good opportunity to sell surplus stock. Expected trend: Prices may stabilize after 2 weeks when new harvest arrives.',
        aiSpecification: 'Economic Intelligence Report',
        goal: 'Help farmers make more money',
        region: 'South Region',
        affectedAreas: ['Karnataka', 'Telangana', 'Andhra Pradesh'],
        severity: 'Medium',
        isActive: true,
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
      },
      {
        expertId: userId,
        expertName: "System Admin",
        expertEmail: user.email,
        expertRole: 'admin',
        alertType: 'Task',
        title: 'Scheduled Fertilizer Application - Maize Crop',
        content: 'It is time for the second stage of fertilizer application (V4-V6 stage) for maize crops in eastern regions. Recommended: Split application of 80 kg N/ha as Urea. Expected application window: Next 7-10 days.',
        aiSpecification: 'Regional Management Protocol',
        goal: 'Get everyone to spray/fertilize at once',
        region: 'East Region',
        affectedAreas: ['Bihar', 'Jharkhand', 'West Bengal', 'Odisha'],
        severity: 'Medium',
        isActive: true,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
      {
        expertId: userId,
        expertName: "System Admin",
        expertEmail: user.email,
        expertRole: 'admin',
        alertType: 'Outbreak',
        title: 'Fall Armyworm Attack - Central Region',
        content: 'Moderate infestation of fall armyworm reported on maize crops. Economic threshold: >5 larvae per plant. Control measures: Spray Spinosad 45% SC @ 1 ml/L or use biopesticides. Scout fields regularly.',
        aiSpecification: 'Technical Bio-Security Bulletin',
        goal: 'Stop pest from spreading',
        region: 'Central Region',
        affectedAreas: ['Madhya Pradesh', 'Chhattisgarh', 'Uttar Pradesh'],
        severity: 'Medium',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    ];

    const createdAlerts = await Alert.insertMany(testAlerts);
    
    res.status(201).json({
      message: "Test alerts created successfully",
      count: createdAlerts.length,
      alerts: createdAlerts.map(a => ({
        _id: a._id,
        title: a.title,
        alertType: a.alertType,
        severity: a.severity,
        expiresAt: a.expiresAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create test alerts" });
  }
};

/**
 * DELETE ALL ALERTS (For development/reset purposes)
 */
exports.deleteAllAlerts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId);
    
    // Only admins can delete all alerts
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can delete alerts" });
    }

    const result = await Alert.deleteMany({});
    
    res.status(200).json({
      message: "All alerts deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete alerts" });
  }
};

/**
 * GET ALERTS STATUS (For debugging)
 */
exports.getAlertsStatus = async (req, res) => {
  try {
    const totalCount = await Alert.countDocuments();
    const activeCount = await Alert.countDocuments({ isActive: true });
    const expiredCount = await Alert.countDocuments({ 
      expiresAt: { $lte: new Date() } 
    });
    const validCount = await Alert.countDocuments({ 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    const alerts = await Alert.find().select('title alertType severity isActive expiresAt createdAt').sort({ createdAt: -1 });

    res.status(200).json({
      summary: {
        totalCount,
        activeCount,
        expiredCount,
        validCount,
        willDisplay: validCount
      },
      alerts: alerts.map(a => ({
        _id: a._id,
        title: a.title,
        alertType: a.alertType,
        severity: a.severity,
        isActive: a.isActive,
        expiresAt: a.expiresAt,
        isExpired: a.expiresAt < new Date(),
        willDisplay: a.isActive && a.expiresAt > new Date(),
        createdAt: a.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to get status" });
  }
};
