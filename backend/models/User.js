const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String },

  // what type of user (farmer, buyer, expert, etc)
  role: {
    type: String,
    enum: ['user', 'farmer', 'admin', 'buyer', 'expert'],
    default: 'user',
  },

  // farmers and experts need approval, others auto-approved
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function () {
      // check if user is farmer or expert
      return (this.role === 'farmer' || this.role === 'expert')
        ? 'pending'
        : 'approved';
    },
  },

  firebaseUid: String,
  profilePic:  String,
  phone:       String,
  place:       String,
  address:     String,

  // flag to check if welcome email was already sent
  welcomeSent: { type: Boolean, default: false },

  // track if user is online or not
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);