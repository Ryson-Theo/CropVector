const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  area: { type: Number, required: true },
  unit: { type: String, enum: ['Acre', 'Hectare'], default: 'Acre' },
  method: { type: String, default: 'Direct sowing' },
  season: { type: String, enum: ['Kharif', 'Rabi', 'Zaid'], default: 'Kharif' },
  sowingDate: { type: Date },
  stage: { type: String, enum: ['Land Preparation', 'Sowing', 'Germination', 'Vegetative Growth', 'Flowering', 'Harvest'], default: 'Land Preparation' },
  notes: { type: String },
  days: { type: Number, default: 0 },
  
  // location from the field
  location: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: [Number] // [longitude, latitude]
  },
  locationName: String, // field name
  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Field' }, // source field
  
  // where the user pinned this crop
  pinnedLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number] // [longitude, latitude]
  },
  pinnedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// for location searches
CropSchema.index({ 'location': '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Crop', CropSchema);