const mongoose = require("mongoose");

const machineryBookingSchema = new mongoose.Schema({
  machineryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machinery",
    required: true
  },
  ownerFarmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true
  },
  renterFarmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true
  },
  startDate: Date,
  endDate: Date,
  totalCost: Number,
  status: {
    type: String,
    enum: ["pending", "approved", "picked-up", "returning", "returned", "rejected", "completed"],
    default: "pending"
  },
  pickedUpDate: Date,
  returnedDate: Date
}, { timestamps: true });

module.exports = mongoose.model("MachineryBooking", machineryBookingSchema);
