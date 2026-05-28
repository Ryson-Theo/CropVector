const mongoose = require('mongoose');

const HashtagSchema = new mongoose.Schema({
  tag: { type: String, unique: true, required: true, lowercase: true },
  count: { type: Number, default: 1 },
  lastUsed: { type: Date, default: Date.now },
  category: { type: String, enum: ['crop', 'pest', 'fertilizer', 'water', 'soil', 'general'], default: 'general' }
});

module.exports = mongoose.model('Hashtag', HashtagSchema);
