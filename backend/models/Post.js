const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['farmer', 'expert', 'buyer', 'user'], required: true },
  fullName: String,
  profilePic: String,
  
  // the post itself
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: String,
  hashtags: [String],
  
  // interactions on this post
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0, min: 0 },
  commentsCount: { type: Number, default: 0 },
  likedBy: [mongoose.Schema.Types.ObjectId],
  viewedBy: [mongoose.Schema.Types.ObjectId], // keep track of who viewed
  
  // verify if user is an expert
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  verificationNote: String,
  
  // if the post was reported
  isFlagged: { type: Boolean, default: false },
  flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flaggedAt: Date,
  flagReason: String,
  
  // timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
