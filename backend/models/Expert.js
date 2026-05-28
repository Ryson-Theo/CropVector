const mongoose = require('mongoose');
const ExpertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: String,
  experience: String,
  license: String,
  phone: String,
  place: String,
  address: String
});
module.exports = mongoose.model('Expert', ExpertSchema);