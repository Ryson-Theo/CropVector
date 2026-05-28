import React, { useEffect, useState } from "react";
import axios from "axios";
import { Check, X, User, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";
import "./ExpertSubPages.css";

const ContentValidation = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // {postId, action, note}
  const { toasts, addToast, removeToast } = useToast();

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const fetchPosts = async () => {
    console.log(' ContentValidation Debug:', {
      token: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
      userRole,
      isExpert: userRole === 'expert'
    });
    
    if (!token) {
      addToast("Not authenticated. Please login.", "error");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/posts/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend returns array directly, no need for .posts
      const data = Array.isArray(res.data) ? res.data : res.data.posts || [];
      console.log('=== ContentValidation fetchPosts SUCCESS ===', { 
        status: res.status,
        isArray: Array.isArray(res.data),
        dataLength: data.length,
        firstPost: data[0]
      });
      setPosts(data);
      if (data.length === 0) {
        addToast("No posts to review yet", "info");
      }
    } catch (err) {
      console.error("Failed to load posts:", err?.response?.data || err.message);
      addToast(`Failed to load posts: ${err?.response?.data?.error || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleAction = async (postId, action, note = "") => {
    const confirmMessage = action === 'verify' ? 'Verify this post as accurate?' : 
                          action === 'flag' ? 'Flag this post as inaccurate?' : 
                          'Delete this post permanently?';
    
    // Prevent experts from deleting posts
    if (action === 'delete') {
      addToast("Experts cannot delete posts. Only admins can delete flagged posts.", "error");
      return;
    }
    
    // Set confirmation state instead of inline toast
    setConfirmAction({ postId, action, note, confirmMessage });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    const { postId, action, note } = confirmAction;
    setActioning(postId + "-" + action);
    
    try {
      await axios.patch(
        `http://localhost:5000/api/posts/${postId}/moderate`,
        { action, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast(`Post ${action}d successfully!`, "success");
      setConfirmAction(null);
      await fetchPosts();
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err.message || "Action failed";
      addToast(message, "error");
    } finally {
      setActioning(null);
    }
  };

  const cancelAction = () => {
    if (confirmAction) {
      addToast(`${confirmAction.action} cancelled`, "info");
    }
    setConfirmAction(null);
  };

  return (
    <div className="expert-validation-page">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* Confirmation Modal */}
      {confirmAction && (
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
            <h3 style={{ margin: "0 0 12px 0" }}>Confirm Action</h3>
            <p style={{ margin: "0 0 20px 0", color: "#64748b" }}>
              Are you sure? {confirmAction.confirmMessage}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button 
                onClick={cancelAction}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={executeAction}
                style={{
                  padding: "8px 16px",
                  backgroundColor: confirmAction.action === 'delete' ? "#ef4444" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                {confirmAction.action === 'verify' && 'Verify'}
                {confirmAction.action === 'flag' && 'Flag'}
                {confirmAction.action === 'delete' && 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="hub-header">
        <h2>Content Validation</h2>
        <span>{posts.length} items</span>
      </div>

      <div className="validation-grid">
        <div className="posts-column">
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="empty">No posts found.</div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="post-card-review">
                <div className="post-card-top">
                  <div className="author-info"><User size={14} /> {post.fullName || post.author || 'Unknown'}</div>
                  <div className="post-meta">{new Date(post.createdAt).toLocaleString()}</div>
                </div>

                <h4 className="post-title">{post.title}</h4>
                <p className="post-content">{post.content}</p>

                <div className="badge-row">
                  {post.isVerified && (
                    <div className="badge verified">
                      <CheckCircle size={16} /> 
                      <div style={{flex: 1}}>
                        <strong>✓ Verified</strong>
                        <div style={{fontSize: '11px', opacity: 0.8, marginTop: '2px'}}>
                          {post.verifiedAt && new Date(post.verifiedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {post.isFlagged && (
                    <div className="badge flagged">
                      <AlertCircle size={16} /> 
                      <div style={{flex: 1}}>
                        <strong>⚠ Flagged</strong>
                        <div style={{fontSize: '11px', opacity: 0.8, marginTop: '2px'}}>
                          {post.flagReason || post.flaggedReason || 'Inaccurate'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="post-actions">
                  <button
                    className="e-btn approve"
                    disabled={actioning === post._id + "-verify"}
                    onClick={() => handleAction(post._id, "verify", "Marked verified by expert")}
                  >
                    <Check size={16} /> Verify
                  </button>

                  <button
                    className="e-btn reject"
                    disabled={actioning === post._id + "-flag"}
                    onClick={() => handleAction(post._id, "flag", "Contains inaccurate information")}
                  >
                    <X size={16} /> Flag as Fake
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="validation-side">
          <div className="side-card">
            <h4>Guidelines</h4>
            <ul>
              <li>Verify factual and practical advice.</li>
              <li>Flag posts that are misleading, unsafe, or incorrect.</li>
              <li>Use Delete for clearly inappropriate or abusive content.</li>
            </ul>
          </div>

          <div className="side-card">
            <h4>Quick Stats</h4>
            <div>Total posts: {posts.length}</div>
            <div>Verified: {posts.filter(p => p.isVerified).length}</div>
            <div>Flagged: {posts.filter(p => p.isFlagged).length}</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ContentValidation;
