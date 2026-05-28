const Field = require('../models/Field');
const POI = require('../models/POI');
const DiseaseHistory = require('../models/DiseaseHistory');
const DisasterLog = require('../models/DisasterLog');
const User = require('../models/User');

// make a new field
exports.createField = async (req, res) => {
  try {
    const { fieldName, fieldCode, areaInHectares, soilType, location, boundary, currentCrop } = req.body;
    const farmerId = req.user?.id || req.user?.userId;

    if (!farmerId) return res.status(401).json({ error: "Unauthorized" });
    if (!fieldName || !areaInHectares) return res.status(400).json({ error: "Field name and area required" });

    const fieldObj = {
      farmerId,
      fieldName,
      fieldCode: fieldCode || `FIELD-${Date.now()}`,
      areaInHectares: parseFloat(areaInHectares),
      areaInAcres: parseFloat(areaInHectares) * 2.471,
      soilType: soilType || 'Mixed',
      currentCrop: currentCrop || {}
    };

    // add location if it's valid
    if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      fieldObj.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    // add boundary if it's valid
    if (boundary?.coordinates && Array.isArray(boundary.coordinates) && boundary.coordinates.length > 0) {
      fieldObj.boundary = {
        type: 'Polygon',
        coordinates: boundary.coordinates
      };
    }

    const field = new Field(fieldObj);
    await field.save();
    res.status(201).json({ message: "Field created successfully", field });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

// get all fields for a farmer
exports.getFarmerFields = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?.userId;
    if (!farmerId) return res.status(401).json({ error: "Unauthorized" });

    const fields = await Field.find({ farmerId })
      .populate('pois')
      .populate('diseaseHistory')
      .populate('disasterLogs')
      .sort({ createdAt: -1 });

    res.status(200).json(fields);
  } catch (err) {    res.status(500).json({ error: "Failed to fetch fields" });
  }
};

// get a single field
exports.getField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const farmerId = req.user?.id || req.user?.userId;

    const field = await Field.findById(fieldId)
      .populate('pois')
      .populate('diseaseHistory')
      .populate('disasterLogs');

    if (!field) return res.status(404).json({ error: "Field not found" });
    if (field.farmerId.toString() !== farmerId) return res.status(403).json({ error: "Not authorized" });

    res.status(200).json(field);
  } catch (err) {    res.status(500).json({ error: "Failed to fetch field" });
  }
};

// change a field
exports.updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const farmerId = req.user?.id || req.user?.userId;
    const updates = req.body;

    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ error: "Field not found" });
    if (field.farmerId.toString() !== farmerId) return res.status(403).json({ error: "Not authorized" });

    // Update allowed fields
    const allowedUpdates = ['fieldName', 'soilType', 'soilPH', 'soilMoisture', 'currentCrop', 'status', 'boundary', 'location'];
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) field[key] = updates[key];
    });

    // Special handling for location to ensure proper GeoJSON format
    if (updates.location?.coordinates && Array.isArray(updates.location.coordinates) && updates.location.coordinates.length === 2) {
      field.location = {
        type: 'Point',
        coordinates: updates.location.coordinates
      };    }

    await field.save();
    res.status(200).json({ message: "Field updated", field });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE FIELD
 */
exports.deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const farmerId = req.user?.id || req.user?.userId;

    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ error: "Field not found" });
    if (field.farmerId.toString() !== farmerId) return res.status(403).json({ error: "Not authorized" });

    // Delete all related POIs and records
    await POI.deleteMany({ fieldId });
    await DiseaseHistory.deleteMany({ fieldId });
    await DisasterLog.deleteMany({ fieldId });
    
    await Field.findByIdAndDelete(fieldId);
    res.status(200).json({ message: "Field deleted successfully" });
  } catch (err) {    res.status(500).json({ error: "Failed to delete field" });
  }
};

/**
 * GET FIELDS NEAR LOCATION (Geospatial query)
 */
exports.getFieldsNearLocation = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;
    const farmerId = req.user?.id || req.user?.userId;

    if (!longitude || !latitude) return res.status(400).json({ error: "Coordinates required" });

    const fields = await Field.find({
      farmerId,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance) || 5000 // 5km default
        }
      }
    });

    res.status(200).json(fields);
  } catch (err) {    res.status(500).json({ error: "Failed to fetch fields" });
  }
};

/**
 * UPDATE FIELD PINNED LOCATION
 */
exports.updateFieldLocation = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { longitude, latitude } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: "Longitude and latitude required" });
    }

    const field = await Field.findById(fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update location (replaces existing location)
    field.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    field.updatedAt = new Date();
    await field.save();    res.status(200).json({ 
      message: "Field location updated successfully", 
      field,
      location: field.location 
    });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

