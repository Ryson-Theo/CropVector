const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');
const Disease = require('../models/Disease');
const Location = require('../models/Location');
const User = require('../models/User');

exports.getCrops = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const crops = await Crop.find({ farmerId: farmer._id });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCrop = async (req, res) => {
  try {
    let farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) {
      // Allow on-the-fly farmer profile creation for authenticated farmer users
      if (req.user.role === 'farmer') {
        farmer = await Farmer.create({ userId: req.user.id });
      } else {
        return res.status(404).json({ message: 'Farmer not found' });
      }
    }

    // Build crop data with location from field if provided
    const cropData = { ...req.body, farmerId: farmer._id };
    
    // Remove the temporary location object from req.body if it exists
    delete cropData.location;
    
    // If location is provided in request, convert to proper GeoJSON format
    if (req.body.location?.latitude && req.body.location?.longitude) {
      const lng = parseFloat(req.body.location.longitude);
      const lat = parseFloat(req.body.location.latitude);
      
      // Validate coordinates are numbers
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        cropData.location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
        cropData.locationName = req.body.location.fieldName || 'Synced Location';
      } else {
        // If invalid coordinates, don't include location (will be added later via pin)
        delete cropData.location;
      }
    } else {
      // Ensure location is not partially defined
      delete cropData.location;
    }
    
    // Prevent duplicates: if a crop with same name, fieldId, season and farmer exists, return it
    const existing = await Crop.findOne({
      farmerId: farmer._id,
      fieldId: req.body.fieldId,
      name: req.body.name,
      season: cropData.season || req.body.season
    });
    if (existing) {
      return res.status(200).json({ message: '⚠️ Crop already exists', crop: existing });
    }

    const crop = new Crop(cropData);
    await crop.save();
    res.status(201).json({ message: '✅ Crop created', crop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCrop = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, farmerId: farmer._id },
      { ...req.body, updatedAt: Date.now() },
      { returnDocument: 'after' }
    );
    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json(crop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCrop = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, farmerId: farmer._id });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json({ message: 'Crop deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateCropLocation = async (req, res) => {
  try {
    const { id: cropId } = req.params;
    const { longitude, latitude } = req.body;
    const farmer = await Farmer.findOne({ userId: req.user.id });
    
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    if (!longitude || !latitude) {
      return res.status(400).json({ error: "Longitude and latitude required" });
    }

    const crop = await Crop.findById(cropId);
    if (!crop || crop.farmerId.toString() !== farmer._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update location (replaces existing location)
    crop.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    crop.updatedAt = new Date();
    await crop.save();
    res.status(200).json({ 
      message: "Crop location updated successfully", 
      crop,
      location: crop.location 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Delete crops by field ID (cascade delete when field is deleted)
exports.deleteCropsByFieldId = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    
    const result = await Crop.deleteMany({ 
      farmerId: farmer._id, 
      fieldId: req.params.fieldId 
    });
    
    res.json({ 
      message: `${result.deletedCount} crop(s) deleted for field`, 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDiseases = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const diseases = await Disease.find({ farmerId: farmer._id });
    res.json(diseases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addDisease = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const disease = new Disease({ ...req.body, farmerId: farmer._id });
    await disease.save();
    res.status(201).json(disease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDisease = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const disease = await Disease.findOneAndUpdate(
      { _id: req.params.id, farmerId: farmer._id },
      req.body,
      { returnDocument: 'after' }
    );
    if (!disease) return res.status(404).json({ message: 'Disease not found' });
    res.json(disease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDisease = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const disease = await Disease.findOneAndDelete(
      { _id: req.params.id, farmerId: farmer._id }
    );
    if (!disease) return res.status(404).json({ message: 'Disease not found' });
    res.json({ message: 'Disease deleted successfully', disease });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDiseasesByCropId = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const result = await Disease.deleteMany({ 
      farmerId: farmer._id, 
      cropId: req.params.cropId 
    });
    res.json({ message: `${result.deletedCount} disease(s) deleted`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDiseasesByFieldId = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    
    // Find all crops for this field and delete their diseases
    const crops = await Crop.find({ farmerId: farmer._id, fieldId: req.params.fieldId });
    const cropIds = crops.map(c => c._id);
    
    const result = await Disease.deleteMany({ 
      farmerId: farmer._id, 
      cropId: { $in: cropIds } 
    });
    res.json({ message: `${result.deletedCount} disease(s) deleted`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const locations = await Location.find({ farmerId: farmer._id });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addLocation = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const location = new Location({ ...req.body, farmerId: farmer._id });
    await location.save();
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ userId: req.user.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    const location = await Location.findOneAndDelete({ _id: req.params.id, farmerId: farmer._id });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
