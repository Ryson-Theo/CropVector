const mongoose = require('mongoose');

const POISchema = new mongoose.Schema({
  // which field this is in
  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
  
  // where exactly on the map
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  
  // what type of problem
  category: { type: String, enum: ['Disease', 'Pest', 'WaterLeak', 'WeedPatch', 'Other'], required: true },
  severity: { type: Number, min: 1, max: 10 }, // how bad is it
  
  // disease and pest info
  diseaseName: String,
  symptom: { type: String, enum: ['Yellowing', 'LeafSpots', 'Wilting', 'Blight', 'Powdery', 'Rust', 'Other'] },
  affectedArea: { type: Number, description: "how big is the problem" },
  
  // photo of the problem
  photoUrl: String,
  photoUploadedAt: Date,
  
  // what the AI thinks about it
  aiAnalysis: {
    confirmed: Boolean,
    confidence: Number, // 0-100
    recommendation: String,
    treatmentSuggested: String
  },
  
  // when and who found it
  discoveredAt: Date,
  discoveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// for location searches
POISchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('POI', POISchema);
