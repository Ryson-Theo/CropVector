const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  carrier: { type: String },
  trackingId: { type: String },
  status: { type: String, enum: ['pending','in_transit','delivered','returned'], default: 'pending' },
  estimatedDelivery: { type: Date },
  history: [{ status: String, at: Date }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shipment', ShipmentSchema);
