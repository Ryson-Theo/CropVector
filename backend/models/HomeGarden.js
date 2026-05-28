const mongoose = require('mongoose');

const HomeGardenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Zones data
  zones: [{
    id: { type: String },
    name: { type: String },
    type: { type: String, default: 'Soil-based' },
    location: { type: String, default: 'Balcony' },
    size: { type: String },
    level: { type: String, default: '1' },
    health: { type: String, default: 'good' },
    lastUpdated: { type: Date, default: Date.now }
  }],

  // Water logs
  waterLogs: [{
    id: { type: String },
    zoneId: { type: String },
    pH: { type: Number },
    EC: { type: Number },
    temperature: { type: Number },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: { type: String }
  }],

  // Nutrient recipes
  nutrientRecipes: [{
    id: { type: String },
    name: { type: String },
    ingredientA: { type: String },
    ingredientB: { type: String },
    ratioA: { type: String },
    ratioB: { type: String },
    targetCrop: { type: String },
    dosage: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],

  // Light schedules
  lightSchedules: [{
    id: { type: String },
    zoneId: { type: String },
    onTime: { type: String },
    offTime: { type: String },
    photoperiod: { type: String },
    notes: { type: String },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Pest marks
  pestMarks: [{
    id: { type: String },
    pestName: { type: String },
    zone: { type: String },
    severity: { type: String, default: 'medium' },
    treatment: { type: String },
    dateMarked: { type: Date, default: Date.now }
  }],

  // Custom alerts
  customAlerts: [{
    id: { type: String },
    zone: { type: String },
    type: { type: String, default: 'watering' },
    message: { type: String },
    frequency: { type: String },
    createdAt: { type: Date, default: Date.now },
    nextDue: { type: Date, default: Date.now }
  }],

  // Harvest logs
  harvestLogs: [{
    id: { type: String },
    cropName: { type: String },
    zone: { type: String },
    plantedDate: { type: Date },
    harvestDate: { type: Date },
    quantity: { type: Number },
    unit: { type: String, default: 'kg' },
    notes: { type: String },
    photo: { type: String }, // URL to uploaded photo
    createdAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
HomeGardenSchema.index({ userId: 1 });

module.exports = mongoose.model('HomeGarden', HomeGardenSchema);