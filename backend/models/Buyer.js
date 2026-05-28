const mongoose = require('mongoose');

const BuyerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessType: String,
  address: String,
  place: String,
  phone: String,
  license: String,
  isOnline: { type: Boolean, default: false }, // new
  lastSeen: { type: Date, default: Date.now }, // new  // optional
});

module.exports = mongoose.model('Buyer', BuyerSchema);