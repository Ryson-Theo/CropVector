const mongoose = require('mongoose');

const DisasterLogSchema = new mongoose.Schema({
  // which field was affected
  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
  
  // what kind of disaster
  disasterType: { type: String, enum: ['Flood', 'Frost', 'Hail', 'Drought', 'Storm', 'Other'], required: true },
  severity: { type: Number, min: 1, max: 10 },
  
  // how much of the field
  areaAffectedInHectares: Number,
  
  // timeline
  disasterDate: { type: Date, required: true },
  discoveryDate: Date,
  recoveryStartDate: Date,
  recoveryEndDate: Date,
  recoveryDays: Number,
  
  // how bad was the damage
  estimatedCropLoss: { type: Number, description: "how much crop was lost" },
  estimatedFinancialLoss: Number,
  cropReplacements: String,
  
  // how we recovered
  recoveryNotes: String,
  recoveryMethods: [String], // e.g., ["Drainage", "Replanting", "Fertilizer Recovery"]
  recoverySuccess: { type: String, enum: ['Full', 'Partial', 'Failed'] },
  
  // weather data during it
  weatherData: {
    rainfall: Number,
    temperature: Number,
    humidity: Number,
    windSpeed: Number
  },
  
  // photos and documents
  photosUrl: [String],
  insuranceClaimId: String,
  
  // if this can help predict future disasters
  triggersPredictor: Boolean,
  predictivePatterns: {
    season: String,
    month: Number,
    topographyRisk: String, // e.g., "North-East corner"
    probability: Number
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DisasterLog', DisasterLogSchema);
