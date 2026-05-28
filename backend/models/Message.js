// backend/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ["farmer", "buyer", "user"], default: "user" },

  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverRole: { type: String, enum: ["farmer", "buyer", "user"], default: "farmer" },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MachineryBooking"
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },

  content: { type: String, required: true },

  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },

  isEdited: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  readAt: Date
});

module.exports = mongoose.model("Message", messageSchema);