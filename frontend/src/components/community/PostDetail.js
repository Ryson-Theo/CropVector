import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, ArrowLeft, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";
import "./PostDetail.css";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      // GET already increments views in the backend
      const res = await axios.get(`http://localhost:5000/api/posts/${postId}`);
      setPost(res.data);
      
      await fetchComments();
    } catch (err) {
      console.error("Failed to load post:", err);
      addToast("Failed to load post", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      await axios.post(
        `http://localhost:5000/api/posts/${postId}/comments`,
        { content: commentText, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText("");
      addToast("Comment added successfully!", "success");
      await fetchComments();
    } catch (err) {
      console.error("Failed to add comment:", err);
      addToast("Failed to add comment", "error");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.content?.substring(0, 120), url });
        return;
      } catch (err) {
        // fall through
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      addToast("Post link copied to clipboard!", "success");
    } catch (err) {
      addToast("Copy this link: " + url, "info");
    }
  };

  const handleDeletePost = async () => {
    // Check if post is verified or flagged
    if (post.isVerified || post.isFlagged) {
      addToast("Cannot delete post after expert review", "error");
      setDeleteConfirm(false);
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast("Post deleted successfully", "success");
      setDeleteConfirm(false);
      setTimeout(() => navigate("/community"), 1500);
    } catch (err) {
      console.error("Delete error:", err);
      addToast("Failed to delete post", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="post-detail-loading">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="post-detail-error">
        <h2>Post not found</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "400px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>Delete Post</h3>
            <p style={{ margin: "0 0 20px 0", color: "#64748b" }}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button 
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  opacity: deleting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePost}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  opacity: deleting ? 0.6 : 1
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back
      </button>

      <div className="post-detail-card">
        <div className="post-header">
          <div className="post-author">
            <img src={post.userId?.profilePic ? `http://localhost:5000/${post.userId.profilePic}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId?.email}`} alt="Author" className="author-avatar" />
            <div>
              <div className="author-info">
                <span className="author-name">{post.fullName}</span>
                <span className={`role-badge ${post.userRole}`}>{post.userRole}</span>
              </div>
              <span className="post-time">{new Date(post.createdAt).toLocaleDateString()} • {post.views} views</span>
            </div>
          </div>
        </div>

        {post.isVerified && (
          <div className="moderation-badge verified">
            <CheckCircle size={16} /> Verified by {post.verifiedBy?.fullName || "Expert"}
          </div>
        )}
        {post.isFlagged && (
          <div className="moderation-badge flagged">
            <AlertCircle size={16} /> Flagged as Inaccurate by {post.flaggedBy?.fullName || "Expert"}
          </div>
        )}

        <div className="post-content">
          <h1 className="post-title">{post.title}</h1>
          <p className="post-text">{post.content}</p>
          {post.image && <img src={`http://localhost:5000/${post.image}`} alt="Post" className="post-image" />}

          <div className="post-hashtags">
            {post.hashtags?.map((tag, idx) => (
              <span key={idx} className="hashtag-pill">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="post-engagement">
          <button className="engagement-btn">
            <Heart size={20} /> {post.likes} Likes
          </button>
          <button className="engagement-btn">
            <MessageCircle size={20} /> {post.commentsCount} Comments
          </button>
          <button onClick={handleShare} className="engagement-btn">
            <Share2 size={20} /> Share
          </button>
          <button 
            onClick={() => setDeleteConfirm(true)}
            className="engagement-btn delete-btn"
            style={{ color: "#ef4444" }}
          >
            <Trash2 size={20} /> Delete
          </button>
        </div>

        <div className="comments-section">
          <h3>Comments ({comments.length})</h3>
          {comments.map((comment) => (
            <div key={comment._id} className="comment">
              <img src={comment.profilePic ? `http://localhost:5000/${comment.profilePic}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.fullName}`} alt="Commenter" className="comment-avatar" />
              <div className="comment-content">
                <span className="comment-author">{comment.fullName}</span>
                <p>{comment.content}</p>
                <span className="comment-time">{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          <form onSubmit={handleAddComment} className="add-comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="comment-input"
            />
            <button type="submit" className="comment-btn">Post</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
