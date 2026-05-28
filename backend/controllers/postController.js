const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Hashtag = require('../models/Hashtag');
const User = require('../models/User');

// create a new post
exports.createPost = async (req, res) => {
    try {
        const { title, content, hashtags } = req.body;
        // get user id from token or body
        const userId = req.user?.id || req.user?.userId || req.body.userId;
        
        if (!userId) return res.status(400).json({ error: "User ID is required" });
        
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ error: "User not found" });

        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        }

        const tagsArray = hashtags ? hashtags.split(',').map(tag => tag.trim().toLowerCase()) : [];

        // update hashtag counts
        for (let tag of tagsArray) {
            await Hashtag.findOneAndUpdate(
                { tag },
                { $inc: { count: 1 }, lastUsed: new Date() },
                { upsert: true }
            );
        }

        const post = new Post({
            userId,
            userRole: user.role,
            fullName: user.fullName,
            profilePic: user.profilePic,
            title,
            content,
            image: imageUrl,
            hashtags: tagsArray,
            views: 0,
            viewedBy: []
        });

        await post.save();
        res.status(201).json({ message: "Post created successfully", post });
    } catch (err) {
        res.status(500).json({ error: err.message || "Failed to create post" });
    }
};

// get all posts with search and hashtags
exports.getPosts = async (req, res) => {
    try {
        const { hashtag, search } = req.query;
        let filter = {};

        if (hashtag) {
            filter.hashtags = hashtag.toLowerCase();
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        // make sure all posts have views
        await Post.updateMany(
            { views: { $exists: false } },
            { $set: { views: 0 } }
        );

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .lean();
        
        // convert to string ids for frontend
        const postsWithStringIds = posts.map(post => ({
            ...post,
            userId: post.userId.toString ? post.userId.toString() : String(post.userId),
            views: post.views || 0  // Ensure views is always a number
        }));

        res.status(200).json(postsWithStringIds);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
};

/**
 * GET PENDING POSTS (For expert moderation)
 */
exports.getPendingPosts = async (req, res) => {
    try {
        // Experts see all posts (both verified and unverified) to manage them
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .lean();
        
        // Convert userId ObjectId to string for frontend comparison
        const postsWithStringIds = posts.map(post => ({
            ...post,
            userId: post.userId.toString ? post.userId.toString() : String(post.userId)
        }));

        res.status(200).json(postsWithStringIds);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
};

/**
 * MODERATE POST (Expert verification)
 */
exports.moderatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { action, note } = req.body;  // action: 'verify' or 'flag' (delete removed from expert actions)
        const expertId = req.user?.id || req.user?.userId;
        
        if (!expertId) return res.status(401).json({ error: "Unauthorized" });

        // Only experts can moderate
        const expert = await User.findById(expertId);
        if (expert?.role !== 'expert') {
            return res.status(403).json({ error: "Only experts can moderate posts" });
        }

        // Experts cannot delete posts - only verify or flag
        if (action === 'delete') {
            return res.status(403).json({ error: "Experts cannot delete posts. Only admins can delete flagged posts." });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (action === 'verify') {
            post.isVerified = true;
            post.verificationNote = note || '';
            post.verifiedBy = expertId;
            post.verifiedAt = new Date();
        } else if (action === 'flag') {
            post.isFlagged = true;
            post.flagReason = note || '';
            post.flaggedBy = expertId;
            post.flaggedAt = new Date();
        } else {
            return res.status(400).json({ error: "Invalid action. Use 'verify' or 'flag'." });
        }

        await post.save();
        res.status(200).json({ message: `Post ${action}d successfully`, post });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * UPDATE POST (Only if not moderated)
 */
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content, hashtags } = req.body;
        const userId = req.user?.id || req.body.userId;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized to update this post" });
        }

        // Prevent edit after expert validation
        if (post.isVerified || post.isFlagged) {
            return res.status(403).json({ error: "Post cannot be edited after expert review" });
        }

        // Update hashtags
        if (hashtags) {
            const tagsArray = hashtags.split(',').map(tag => tag.trim().toLowerCase());
            
            // Remove old hashtags
            for (let oldTag of post.hashtags) {
                await Hashtag.updateOne({ tag: oldTag }, { $inc: { count: -1 } });
            }

            // Add new hashtags
            for (let newTag of tagsArray) {
                await Hashtag.findOneAndUpdate(
                    { tag: newTag },
                    { $inc: { count: 1 }, lastUsed: new Date() },
                    { upsert: true }
                );
            }

            post.hashtags = tagsArray;
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.updatedAt = new Date();

        await post.save();
        res.status(200).json({ message: "Post updated successfully", post });
    } catch (err) {
        res.status(500).json({ error: "Failed to update post" });
    }
};

/**
 * DELETE POST (Author or Expert)
 */
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id || req.body.userId;
        const userRole = req.user?.role || req.body.userRole;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Allow author or expert to delete
        if (post.userId.toString() !== userId && userRole !== 'expert') {
            return res.status(403).json({ error: "Not authorized to delete this post" });
        }

        // Prevent author delete after expert validation (experts can delete anytime)
        if (userRole !== 'expert' && (post.isVerified || post.isFlagged)) {
            return res.status(403).json({ error: "Cannot delete post after expert review" });
        }

        // Update hashtag counts
        for (let tag of post.hashtags) {
            await Hashtag.updateOne({ tag }, { $inc: { count: -1 } });
        }

        // Delete all comments
        await Comment.deleteMany({ postId });

        await Post.findByIdAndDelete(postId);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete post" });
    }
};

/**
 * GET SINGLE POST BY ID
 */
exports.getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        // Get the post first
        let post = await Post.findById(postId).populate('userId', 'fullName profilePic role email');
        if (!post) return res.status(404).json({ error: "Post not found" });
        // Initialize views if it doesn't exist
        if (post.views === undefined || post.views === null) {
            post.views = 0;
        }
        
        // Increment views
        post.views = post.views + 1;
        const savedPost = await post.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
};

/**
 * LIKE POST
 */
exports.likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id || req.body.userId;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const hasLiked = post.likedBy.includes(userId);

        if (hasLiked) {
            post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likedBy.push(userId);
            post.likes += 1;
        }

        await post.save();
        res.status(200).json({ message: hasLiked ? "Post unliked" : "Post liked", likes: post.likes });
    } catch (err) {
        res.status(500).json({ error: "Failed to like post" });
    }
};

/**
 * INCREMENT VIEWS
 */
exports.incrementViews = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { views: 1 } },
            { returnDocument: 'after' }
        );
        if (!post) return res.status(404).json({ error: "Post not found" });
        res.status(200).json({ views: post.views });
    } catch (err) {
        res.status(500).json({ error: "Failed to update views" });
    }
};

/**
 * GET HASHTAG RECOMMENDATIONS
 */
exports.getHashtagRecommendations = async (req, res) => {
    try {
        const hashtags = await Hashtag.find()
            .sort({ count: -1, lastUsed: -1 })
            .limit(15)
            .lean();

        res.status(200).json(hashtags);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch hashtag recommendations" });
    }
};

/**
 * GET MODERATION STATS (For Admin)
 */
exports.getModerationStats = async (req, res) => {
    try {
        const totalPosts = await Post.countDocuments();
        const verifiedPosts = await Post.countDocuments({ isVerified: true });
        const pendingPosts = await Post.countDocuments({ isVerified: false, isFlagged: false });
        const rejectedPosts = await Post.countDocuments({ isFlagged: true });

        const expertVerifications = await Post.aggregate([
            { $match: { verifiedBy: { $exists: true, $ne: null } } },
            { $group: { _id: "$verifiedBy", count: { $sum: 1 } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "expert" } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            totalPosts,
            verifiedPosts,
            pendingPosts,
            rejectedPosts,
            expertVerifications
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

/**
 * GET FLAGGED POSTS (For Admin)
 */
exports.getFlaggedPosts = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        const user = await User.findById(userId);
        
        // Only admins can view flagged posts
        if (user?.role !== 'admin') {
            return res.status(403).json({ error: "Only admins can view flagged posts" });
        }

        const posts = await Post.find({ isFlagged: true })
            .sort({ flaggedAt: -1 })
            .populate('flaggedBy', 'fullName email')
            .lean();
        
        // Convert userId ObjectId to string for frontend comparison
        const postsWithStringIds = posts.map(post => ({
            ...post,
            userId: post.userId.toString ? post.userId.toString() : String(post.userId)
        }));

        res.status(200).json(postsWithStringIds);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch flagged posts" });
    }
};

/**
 * ADMIN DELETE POST (Only for flagged posts)
 */
exports.adminDeletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id || req.user?.userId;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Verify user is admin
        const admin = await User.findById(userId);
        if (admin?.role !== 'admin') {
            return res.status(403).json({ error: "Only admins can delete posts" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Admin can delete any post, but flagged posts are the priority
        // Update hashtag counts
        for (let tag of post.hashtags) {
            await Hashtag.updateOne({ tag }, { $inc: { count: -1 } });
        }

        // Delete all comments
        await Comment.deleteMany({ postId });

        await Post.findByIdAndDelete(postId);
        res.status(200).json({ message: "Post deleted successfully by admin" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete post" });
    }
};

