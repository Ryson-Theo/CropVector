const mongoose = require('mongoose');

const ExpertSuggestionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  crop: String,
  note: String,
  expertId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExpertSuggestion', ExpertSuggestionSchema);
