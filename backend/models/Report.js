const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterRole: { type: String, default: 'user' },
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert' },
  subject: { type: String, required: true },
  message: { type: String },
  type: { type: String, enum: ['consultation', 'issue', 'other'], default: 'consultation' },
  status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new' },
  responseMessage: { type: String },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
