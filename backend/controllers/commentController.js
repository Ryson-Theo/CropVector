const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * ADD COMMENT
 */
exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id || req.body.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const comment = new Comment({
            postId,
            userId,
            userRole: user.role,
            fullName: user.fullName,
            profilePic: user.profilePic,
            content
        });

        await comment.save();

        // Update comment count
        post.commentsCount += 1;
        await post.save();

        res.status(201).json({ message: "Comment added", comment });
    } catch (err) {        res.status(500).json({ error: "Failed to add comment" });
    }
};

/**
 * GET COMMENTS FOR POST
 */
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ postId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(comments);
    } catch (err) {        res.status(500).json({ error: "Failed to fetch comments" });
    }
};

/**
 * DELETE COMMENT
 */
exports.deleteComment = async (req, res) => {
    try {
        const { commentId, postId } = req.params;
        const userId = req.user?.id || req.body.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await Comment.findByIdAndDelete(commentId);

        // Update comment count
        const post = await Post.findById(postId);
        if (post) {
            post.commentsCount = Math.max(0, post.commentsCount - 1);
            await post.save();
        }

        res.status(200).json({ message: "Comment deleted" });
    } catch (err) {        res.status(500).json({ error: "Failed to delete comment" });
    }
};

/**
 * LIKE COMMENT
 */
exports.likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id || req.body.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        const hasLiked = comment.likedBy.includes(userId);

        if (hasLiked) {
            comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            comment.likedBy.push(userId);
            comment.likes += 1;
        }

        await comment.save();
        res.status(200).json({ message: hasLiked ? "Unlike" : "Liked", likes: comment.likes });
    } catch (err) {        res.status(500).json({ error: "Failed to like comment" });
    }
};

