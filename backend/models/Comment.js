const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: String,
  fullName: String,
  profilePic: String,
  
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [mongoose.Schema.Types.ObjectId],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
