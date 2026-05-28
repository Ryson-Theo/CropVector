const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [String],
  price: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  quantity: { type: Number, default: 0 },
  category: { type: String },
  location: { type: String },
  tags: [String],
  status: { type: String, enum: ['active','inactive','removed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
ListingSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Listing', ListingSchema);
