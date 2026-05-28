const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  place: String,
  address: String,
  specialization: String,
  experience: String,
  role: String,
  firebaseUid: String,

  profilePic: String,
  license: String,
  qualification: String,

  otp: String,
  otpExpires: Date,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TempUser", tempUserSchema);
