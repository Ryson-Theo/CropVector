const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' }, // Reference to crop
  cropName: { type: String, required: true },
  type: { type: String, enum: ['Pest', 'Fungal', 'Bacterial', 'Viral', 'Nutrient deficiency'], required: true },
  name: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, enum: ['Reported', 'Under treatment', 'Resolved'], default: 'Reported' },
  photoUrl: String,
  date: { type: Date, default: Date.now },
  season: { type: String, enum: ['Kharif', 'Rabi', 'Zaid'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Disease', DiseaseSchema);