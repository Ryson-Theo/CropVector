const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

// Multer for post images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/posts/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- POST ROUTES ---
router.post('/posts/create', authMiddleware, upload.single('postImage'), postController.createPost);
router.get('/posts/pending', authMiddleware, postController.getPendingPosts);  // Must come BEFORE /:postId
router.get('/posts/flagged', authMiddleware, postController.getFlaggedPosts);  // Admin view flagged posts
router.get('/hashtags/recommendations', postController.getHashtagRecommendations);
router.get('/moderation/stats', authMiddleware, postController.getModerationStats);

// Specific POST routes BEFORE parameterized routes
router.post('/posts/:postId/like', authMiddleware, postController.likePost);
router.post('/posts/:postId/views', postController.incrementViews);
router.patch('/posts/:postId/moderate', authMiddleware, postController.moderatePost);

// General parameterized routes
router.get('/posts', postController.getPosts);
router.get('/posts/:postId', postController.getPost);
router.patch('/posts/:postId', authMiddleware, postController.updatePost);
router.delete('/posts/:postId', authMiddleware, postController.deletePost);
router.delete('/posts/admin/:postId', authMiddleware, postController.adminDeletePost);  // Admin delete flagged posts

// --- EXPERT MODERATION ---

// --- COMMENT ROUTES ---
router.post('/posts/:postId/comments', authMiddleware, commentController.addComment);
router.get('/posts/:postId/comments', commentController.getComments);
router.delete('/posts/:postId/comments/:commentId', authMiddleware, commentController.deleteComment);
router.post('/comments/:commentId/like', authMiddleware, commentController.likeComment);

module.exports = router;

