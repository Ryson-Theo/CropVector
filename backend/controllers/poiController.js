const POI = require('../models/POI');
const Field = require('../models/Field');
const DiseaseHistory = require('../models/DiseaseHistory');

/**
 * CREATE POI (Drop pin on map)
 */
exports.createPOI = async (req, res) => {
  try {
    const { fieldId, longitude, latitude, category, severity, diseaseName, symptom, notes } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!fieldId || !longitude || !latitude || !category) {
      return res.status(400).json({ error: "Field ID, coordinates, and category required" });
    }

    // Verify field ownership
    const field = await Field.findById(fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to add POI to this field" });
    }

    const poi = new POI({
      fieldId,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      category,
      severity: severity || 5,
      diseaseName,
      symptom,
      discoveredAt: new Date(),
      discoveredBy: userId,
      notes
    });

    await poi.save();

    // Add POI to field's POI array
    field.pois.push(poi._id);
    await field.save();

    res.status(201).json({ message: "POI created successfully", poi });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

/**
 * GET POIS FOR FIELD
 */
exports.getFieldPOIs = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const field = await Field.findById(fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const pois = await POI.find({ fieldId }).sort({ createdAt: -1 });
    res.status(200).json(pois);
  } catch (err) {    res.status(500).json({ error: "Failed to fetch POIs" });
  }
};

/**
 * UPDATE POI (e.g., add photo, update with AI analysis)
 */
exports.updatePOI = async (req, res) => {
  try {
    const { poiId } = req.params;
    const { photoUrl, aiAnalysis, severity, notes } = req.body;
    const userId = req.user?.id || req.user?.userId;

    const poi = await POI.findById(poiId);
    if (!poi) return res.status(404).json({ error: "POI not found" });

    // Verify ownership via field
    const field = await Field.findById(poi.fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (photoUrl) poi.photoUrl = photoUrl;
    if (photoUrl) poi.photoUploadedAt = new Date();
    if (aiAnalysis) poi.aiAnalysis = aiAnalysis;
    if (severity) poi.severity = severity;
    if (notes) poi.notes = notes;

    await poi.save();
    res.status(200).json({ message: "POI updated", poi });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE POI
 */
exports.deletePOI = async (req, res) => {
  try {
    const { poiId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const poi = await POI.findById(poiId);
    if (!poi) return res.status(404).json({ error: "POI not found" });

    const field = await Field.findById(poi.fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Remove POI from field's POI array
    field.pois = field.pois.filter(id => id.toString() !== poiId);
    await field.save();

    await POI.findByIdAndDelete(poiId);
    res.status(200).json({ message: "POI deleted" });
  } catch (err) {    res.status(500).json({ error: "Failed to delete POI" });
  }
};

/**
 * GET POIS WITHIN FIELD BOUNDARY (Heat map data)
 */
exports.getPOIHeatmap = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const field = await Field.findById(fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const pois = await POI.find({
      fieldId,
      'location': {
        $geoWithin: {
          $geometry: field.boundary
        }
      }
    });

    // Format for heat map visualization
    const heatmapData = pois.map(poi => ({
      coordinates: poi.location.coordinates,
      intensity: poi.severity || 5,
      category: poi.category,
      diseaseName: poi.diseaseName
    }));

    res.status(200).json(heatmapData);
  } catch (err) {    res.status(500).json({ error: "Failed to generate heatmap" });
  }
};

/**
 * MARK DISEASE (Create POI + Disease History + Early Warning)
 */
exports.markDisease = async (req, res) => {
  try {
    const { fieldId, cropId, longitude, latitude, diseaseName, symptom, severity, weatherData } = req.body;
    const userId = req.user?.id || req.user?.userId;

    const field = await Field.findById(fieldId);
    if (!field || field.farmerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Prepare photo URL if uploaded
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/diseases/${req.file.filename}`;    }

    // Sanitize weather data - ensure no NaN values
    const sanitizedWeatherData = {
      temperature: Number.isFinite(weatherData?.temperature) ? weatherData.temperature : 25,
      humidity: Number.isFinite(weatherData?.humidity) ? weatherData.humidity : 60,
      rainfall: Number.isFinite(weatherData?.rainfall) ? weatherData.rainfall : 0,
      windSpeed: Number.isFinite(weatherData?.windSpeed) ? weatherData.windSpeed : 5
    };

    // Create POI
    const poi = new POI({
      fieldId,
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      category: 'Disease',
      diseaseName,
      symptom,
      severity,
      photoUrl: photoUrl,
      photoUploadedAt: req.file ? new Date() : null,
      discoveredAt: new Date(),
      discoveredBy: userId
    });
    await poi.save();

    // Create Disease History for learning
    const diseaseHistory = new DiseaseHistory({
      fieldId,
      poiId: poi._id,
      diseaseName,
      severity,
      symptom,
      location: poi.location,
      weatherAtOutbreak: sanitizedWeatherData,
      cropStageAtOutbreak: field.currentCrop?.growthStage,
      daysAfterPlanting: field.currentCrop?.daysSincePlanting,
      outbreakStartDate: new Date(),
      triggersEarlyWarning: true,
      warningConditions: {
        temperatureRange: { 
          min: sanitizedWeatherData.temperature - 2, 
          max: sanitizedWeatherData.temperature + 2 
        },
        humidityRange: { 
          min: Math.max(0, sanitizedWeatherData.humidity - 5), 
          max: Math.min(100, sanitizedWeatherData.humidity + 5) 
        },
        growthStages: [field.currentCrop?.growthStage]
      }
    });
    await diseaseHistory.save();

    // Also create a Disease record for the farmer's disease tracking
    const Farmer = require('../models/Farmer');
    const Disease = require('../models/Disease');
    
    const farmer = await Farmer.findOne({ userId: userId });
    if (farmer) {
      const disease = new Disease({
        farmerId: farmer._id,
        cropId: cropId, // Reference to the crop
        cropName: diseaseName,
        name: diseaseName,
        type: 'Pest', // Default, can be enhanced with symptom-based classification
        severity: severity <= 3 ? 'Low' : severity <= 7 ? 'Medium' : 'High',
        status: 'Reported',
        season: field.currentCrop?.season || 'Kharif',
        photoUrl: photoUrl
      });
      await disease.save();    }

    // Add to field
    field.pois.push(poi._id);
    field.diseaseHistory.push(diseaseHistory._id);
    await field.save();

    const message = photoUrl ? "✅ Disease marked with photo evidence" : "✅ Disease marked (photo upload skipped)";
    res.status(201).json({ 
      message, 
      poi, 
      diseaseHistory, 
      photoUrl,
      photoError: req.photoError || null
    });
  } catch (err) {    res.status(500).json({ error: err.message });
  }
};

