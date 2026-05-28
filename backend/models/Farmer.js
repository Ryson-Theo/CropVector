const mongoose = require('mongoose');

const FarmerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  license: String,
  address: String,
  place: String,
  phone: String,
  cropsManaged: [{ type: String }],
 isOnline: { type: Boolean, default: false }, // new
  lastSeen: { type: Date, default: Date.now }, // new // <-- Track online status
});

module.exports = mongoose.model('Farmer', FarmerSchema);