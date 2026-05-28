// backend/models/Otp.js
const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email:    { type: String, required: true, index: true },
  otpHash:  { type: String, required: true },
  expiresAt:{ type: Date, required: true, expires: 0 }, // TTL – auto‑delete when expired
  used:     { type: Boolean, default: false },
});

module.exports = mongoose.model('Otp', OtpSchema);