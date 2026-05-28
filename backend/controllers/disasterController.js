const DisasterLog = require('../models/DisasterLog');
const Field = require('../models/Field');



// Create a disaster log (Farmer only)
exports.createDisaster = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?.userId;
    const data = req.body;

    if (!farmerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!data.fieldId) return res.status(400).json({ error: 'fieldId required' });

    const field = await Field.findById(data.fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (field.farmerId.toString() !== farmerId) return res.status(403).json({ error: 'Not authorized' });

    // Location removed from schema
    const disaster = new DisasterLog({ ...data });
    await disaster.save();

    // Link to field
    field.disasterLogs = field.disasterLogs || [];
    field.disasterLogs.push(disaster._id);
    await field.save();

    res.status(201).json({ message: 'Disaster logged', disaster });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Update disaster (Farmer only)
exports.updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user?.id || req.user?.userId;
    const updates = req.body;

    const disaster = await DisasterLog.findById(id);
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });

    const field = await Field.findById(disaster.fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (field.farmerId.toString() !== farmerId) return res.status(403).json({ error: 'Not authorized' });

    Object.keys(updates).forEach(k => { disaster[k] = updates[k]; });
    disaster.updatedAt = new Date();
    await disaster.save();

    res.status(200).json({ message: 'Disaster updated', disaster });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Delete disaster (Farmer only)
exports.deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user?.id || req.user?.userId;

    const disaster = await DisasterLog.findById(id);
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });

    const field = await Field.findById(disaster.fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (field.farmerId.toString() !== farmerId) return res.status(403).json({ error: 'Not authorized' });

    // Remove from field's disasterLogs array
    field.disasterLogs = field.disasterLogs.filter(d => d.toString() !== id);
    await field.save();

    // Delete the disaster
    await DisasterLog.findByIdAndDelete(id);

    res.status(200).json({ message: 'Disaster deleted' });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Get disasters for current farmer
exports.getMyDisasters = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?.userId;
    if (!farmerId) return res.status(401).json({ error: 'Unauthorized' });

    const fields = await Field.find({ farmerId }).select('_id');
    const fieldIds = fields.map(f => f._id);

    const disasters = await DisasterLog.find({ fieldId: { $in: fieldIds } }).sort({ disasterDate: -1 });
    res.status(200).json(disasters);
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// Get aggregated/discoverable disasters for admin/expert (privacy-preserving)
exports.getPublicDisasters = async (req, res) => {
  try {
    // Only allow admin or expert roles
    const role = req.user?.role || req.user?.userRole;
    if (!role || (role !== 'admin' && role !== 'expert')) return res.status(403).json({ error: 'Not authorized' });

    const disasters = await DisasterLog.find().sort({ disasterDate: -1 }).limit(100);

    // Privacy-preserving mapping: omit farmer identifiers
    const anon = disasters.map(d => ({
      id: d._id,
      disasterType: d.disasterType,
      severity: d.severity,
      disasterDate: d.disasterDate,
      areaAffectedInHectares: d.areaAffectedInHectares,
      estimatedCropLoss: d.estimatedCropLoss,
      estimatedFinancialLoss: d.estimatedFinancialLoss,
      // include weather summary fields (privacy: no farmer identifiers)
      rainfall: d.weatherData?.rainfall ?? null,
      temperature: d.weatherData?.temperature ?? null,
      humidity: d.weatherData?.humidity ?? null,
      windSpeed: d.weatherData?.windSpeed ?? null,
      createdAt: d.createdAt
    }));

    res.status(200).json(anon);
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

