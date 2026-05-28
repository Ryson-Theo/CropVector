const mongoose = require('mongoose');

const DiseaseHistorySchema = new mongoose.Schema({
  // which field got this disease
  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
  
  // where the disease was found
  poiId: { type: mongoose.Schema.Types.ObjectId, ref: 'POI' },
  
  // disease info
  diseaseName: { type: String, required: true },
  severity: { type: Number, min: 1, max: 10 },
  symptom: String,
  
  // exact spot on map
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  
  // weather when it happened
  weatherAtOutbreak: {
    temperature: Number, // Celsius
    humidity: Number, // Percentage
    rainfall: Number, // mm
    windSpeed: Number, // m/s
    growthStage: String
  },
  
  // crop stage when disease started
  cropStageAtOutbreak: String,
  daysAfterPlanting: Number,
  
  // when it got better
  recoveryStartDate: Date,
  recoveryEndDate: Date,
  recoveryDays: Number,
  recoveryNotes: String,
  
  // what we did to fix it
  treatmentApplied: String,
  treatmentDate: Date,
  activeIngredient: String,
  
  // when the disease started
  outbreakStartDate: { type: Date, required: true },
  outbreakEndDate: Date,
  estimatedCropLoss: { type: Number, description: "how much crop was lost" },
  
  // warning for future
  triggersEarlyWarning: Boolean,
  warningConditions: {
    temperatureRange: { min: Number, max: Number },
    humidityRange: { min: Number, max: Number },
    growthStages: [String]
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// for location searches
DiseaseHistorySchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('DiseaseHistory', DiseaseHistorySchema);
