const mongoose = require("mongoose");

const machinerySchema = new mongoose.Schema({
  ownerFarmerId: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
  machineName: { type: String, required: true },
  brand: String, // Acts as "Model / Type"
  category: { 
    type: String, 
    enum: ["Tractor", "Harvester", "Sprayer", "Tiller", "Other"],
    default: "Tractor" 
  },
  hourlyRate: { type: Number, required: true },
  location: { type: String, default: "Not Specified" },
  condition: { 
    type: String, 
    enum: ["excellent", "good", "needs-service"], 
    default: "good" 
  },
  // CHANGED: Match frontend name, or update frontend to match 'availability'
  availableForRent: { type: Boolean, default: true }, 
  nextServiceDate: Date,
  description: String,
  image: String
}, { timestamps: true });

module.exports = mongoose.model("Machinery", machinerySchema);