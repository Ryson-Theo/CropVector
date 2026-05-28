const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: Object }, // { latitude, longitude }
  farmer: { type: Object }, // Farmer profile used for analysis
  climate: { type: Object }, // Climate data used
  mandiPricesUsed: { type: Boolean, default: false },
  input: { type: Object, required: true },
  results: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
