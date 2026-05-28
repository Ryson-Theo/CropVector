const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  // who created this alert
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expertName: String,
  expertEmail: String,
  expertRole: { type: String, default: 'expert' },
  
  // what the alert is about
  alertType: { 
    type: String, 
    enum: ['Outbreak', 'Weather', 'Market', 'Task'], 
    required: true 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  
  // type of report
  aiSpecification: {
    type: String,
    enum: [
      'Technical Bio-Security Bulletin',
      'Agronomic Risk Analysis',
      'Economic Intelligence Report',
      'Regional Management Protocol'
    ]
  },
  
  // what's the goal of this alert
  goal: String,
  
  // how urgent is it
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // which region is affected
  region: String,
  affectedAreas: [String], // e.g., ['North Region', 'East District']
  
  // how many people viewed it
  views: { type: Number, default: 0 },
  viewedBy: [mongoose.Schema.Types.ObjectId], // User IDs who viewed
  
  // is this alert still active
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  
  // when it was created
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', AlertSchema);
