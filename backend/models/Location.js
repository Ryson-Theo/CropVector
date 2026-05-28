const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  name: { type: String, default: 'Unnamed Location' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Location', LocationSchema);