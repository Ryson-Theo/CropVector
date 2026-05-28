const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  // which farmer owns this field
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // field name and code
  fieldName: { type: String, required: true },
  fieldCode: String, // e.g., "FIELD-001"
  
  // exact location on map
  location: {
    type: {
      type: String,
      enum: ['Point'],
      sparse: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      sparse: true
    }
  },
  
  // field's boundaries on map
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      sparse: true
    },
    coordinates: {
      type: [[[Number]]],
      sparse: true
    }
  },
  
  // user can manually pinpoint the field location
  pinnedLocation: {
    type: {
      type: String,
      enum: ['Point'],
      sparse: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      sparse: true
    }
  },
  pinnedAt: Date,
  
  // field size and soil info
  areaInHectares: { type: Number, required: true },
  areaInAcres: Number,
  soilType: { type: String, enum: ['Loamy', 'Sandy', 'Clay', 'Silty', 'Mixed'], default: 'Mixed' },
  soilPH: Number,
  soilMoisture: Number,
  
  // what crop is growing right now
  currentCrop: {
    cropType: String,
    variety: String,
    plantingDate: Date,
    expectedHarvestDate: Date,
    daysSincePlanting: Number,
    growthStage: { type: String, enum: ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity'], default: 'Vegetative' }
  },
  
  // is field active or not
  status: { type: String, enum: ['Active', 'Fallow', 'Abandoned'], default: 'Active' },
  
  // points of interest in this field
  pois: [{ type: mongoose.Schema.Types.ObjectId, ref: 'POI' }],
  
  // diseases that happened in this field
  diseaseHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DiseaseHistory' }],
  
  // disasters like floods, storms
  disasterLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DisasterLog' }],
  
  // timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// makes location searches faster
FieldSchema.index({ 'location': '2dsphere' }, { sparse: true });
FieldSchema.index({ 'boundary': '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Field', FieldSchema);
