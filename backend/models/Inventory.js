const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  // which farmer owns this inventory
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // what type of item (seed, fertilizer, etc)
  itemType: { type: String, enum: ['Seed', 'Fertilizer', 'Chemical', 'Fuel', 'Equipment'], required: true },
  
  // seed stuff
  seedBrand: String,
  seedVariety: String,
  seedLotNumber: String,
  
  // seed quality checks
  germinationPercent: Number,
  purityPercent: Number,
  testDate: Date,
  
  // if the seed was treated with chemicals
  isTreated: Boolean,
  treatmentType: String, // e.g., "Fungicide", "Insecticide"
  treatmentDetails: String,
  
  // how much seed we have and can plant
  bagsInStock: Number,
  bagsPerAcre: Number,
  projectedAcres: Number,
  
  // fertilizer and chemical stuff
  productName: String,
  npkRatio: String, // e.g., "10-20-10"
  activeIngredientPercent: Number,
  activeIngredient: String,
  
  // legal and certification stuff
  epaRegistrationNumber: String,
  sdsDocumentUrl: String, // safety data sheet
  
  // when we can enter the field after spraying
  rei: Number, // hours
  phi: Number, // days before harvest
  
  // how much we have
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ['kg', 'g', 'lbs', 'oz', 'L', 'ml', 'gal', 'bags', 'liters'], required: true },
  unitMetric: String, // for converting units
  
  // where it's stored
  storageLocation: {
    warehouse: String,
    building: String,
    bin: String,
    shelf: String,
    section: String
  },
  
  // storage capacity
  containerCapacity: Number,
  containerCapacityUnit: String,
  fillPercentage: { type: Number, min: 0, max: 100 },
  
  // storage conditions
  storageTemperature: Number,
  storageHumidity: Number,
  
  // batch and expiration
  batchNumber: String,
  manufacturingDate: Date,
  expiryDate: Date,
  
  // usage tracking
  plannedUsage: Number,
  usageUnit: String,
  projectedShortage: Boolean,
  burnRate: Number, // per week
  
  // who we buy from
  supplierName: String,
  supplierEmail: String,
  supplierPhone: String,
  supplierSKU: String,
  
  // cost stuff
  unitCost: Number,
  currency: { type: String, default: 'USD' },
  totalValue: Number,
  
  // track changes to quantity
  adjustmentHistory: [{
    previousQuantity: Number,
    newQuantity: Number,
    adjustmentReason: { type: String, enum: ['Spillage', 'Correction', 'TaskComplete', 'Return', 'Damage', 'Other'] },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adjustedAt: Date,
    notes: String
  }],
  
  // current status
  status: { type: String, enum: ['InStock', 'Low', 'Critical', 'Expired', 'Archived'], default: 'InStock' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// for faster searches
InventorySchema.index({ farmerId: 1, itemType: 1 });
InventorySchema.index({ expiryDate: 1 });
InventorySchema.index({ 'storageLocation.warehouse': 1, 'storageLocation.bin': 1 });

module.exports = mongoose.model('Inventory', InventorySchema);
