import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle, MessageSquare, TrendingUp, BarChart3, RefreshCw, Trash2 } from "lucide-react";
import axios from "axios";
import "./ModerationDashboard.css";

const ModerationDashboard = () => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    verifiedPosts: 0,
    pendingPosts: 0,
    rejectedPosts: 0,
    expertVerifications: []
  });
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const refreshIntervalRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
    fetchFlaggedPosts();
    
    // Auto-refresh every 60 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
      fetchFlaggedPosts();
    }, 60000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/moderation/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Stats Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/posts/flagged", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlaggedPosts(Array.isArray(res.data) ? res.data : res.data.posts || []);
    } catch (err) {
      console.error("Flagged Posts Error:", err);
      setFlaggedPosts([]);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await fetchFlaggedPosts();
  };

  const handleDeleteFlaggedPost = (postId) => {
    setDeleteConfirm(postId);
  };

  const confirmDeletePost = async () => {
    if (!deleteConfirm) return;
    
    setDeleting(deleteConfirm);
    try {
      await axios.delete(`http://localhost:5000/api/posts/admin/${deleteConfirm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlaggedPosts(flaggedPosts.filter(p => p._id !== deleteConfirm));
      setDeleteConfirm(null);
      await fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete post: " + (err?.response?.data?.error || err.message));
    } finally {
      setDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const verificationRate = stats.totalPosts > 0 
    ? ((stats.verifiedPosts / stats.totalPosts) * 100).toFixed(1) 
    : 0;

  return (
    <div className="moderation-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Content Moderation Dashboard</h1>
          <p>Track community posts and expert verifications</p>
        </div>
        <button 
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={handleManualRefresh}
          disabled={refreshing}
          title="Refresh stats"
        >
          <RefreshCw size={20} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading stats...</div>
      ) : (
        <>
          {/* STATS GRID */}
          <div className="stats-grid">
            <div className="stat-box total">
              <MessageSquare size={24} />
              <div className="stat-info">
                <span className="stat-label">Total Posts</span>
                <span className="stat-number">{stats.totalPosts}</span>
              </div>
            </div>

            <div className="stat-box verified">
              <CheckCircle size={24} />
              <div className="stat-info">
                <span className="stat-label">Verified Posts</span>
                <span className="stat-number">{stats.verifiedPosts}</span>
              </div>
            </div>

            <div className="stat-box pending">
              <AlertCircle size={24} />
              <div className="stat-info">
                <span className="stat-label">Pending Review</span>
                <span className="stat-number">{stats.pendingPosts}</span>
              </div>
            </div>

            <div className="stat-box rejected">
              <AlertCircle size={24} />
              <div className="stat-info">
                <span className="stat-label">Rejected Posts</span>
                <span className="stat-number">{stats.rejectedPosts}</span>
              </div>
            </div>

            <div className="stat-box rate">
              <TrendingUp size={24} />
              <div className="stat-info">
                <span className="stat-label">Verification Rate</span>
                <span className="stat-number">{verificationRate}%</span>
              </div>
            </div>
          </div>

          {/* EXPERT VERIFICATIONS */}
          <div className="expert-section">
            <h2 className="section-title">
              <BarChart3 size={20} /> Expert Verification Activity
            </h2>
            {stats.expertVerifications.length === 0 ? (
              <div className="empty-state">No verifications yet</div>
            ) : (
              <div className="expert-grid">
                {stats.expertVerifications.map((expert) => (
                  <div key={expert._id} className="expert-card">
                    <div className="expert-header">
                      <div className="expert-avatar">
                        {expert.expert?.[0]?.fullName?.charAt(0) || "E"}
                      </div>
                      <div className="expert-info">
                        <h3>{expert.expert?.[0]?.fullName || "Unknown Expert"}</h3>
                        <p className="expert-email">{expert.expert?.[0]?.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="verification-count">
                      <span className="count-badge">{expert.count}</span>
                      <span className="count-label">Posts Verified</span>
                    </div>
                    <div className="verification-bar">
                      <div className="bar-fill" style={{ width: `${(expert.count / stats.totalPosts) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VERIFICATION BREAKDOWN */}
          <div className="breakdown-section">
            <h2 className="section-title">Post Status Breakdown</h2>
            <div className="breakdown-chart">
              <div className="breakdown-item verified">
                <div className="breakdown-label">
                  <span>Verified</span>
                  <span className="percentage">{verificationRate}%</span>
                </div>
                <div className="breakdown-bar">
                  <div className="bar-fill verified-fill" style={{ width: `${verificationRate}%` }}></div>
                </div>
                <span className="breakdown-count">{stats.verifiedPosts} posts</span>
              </div>

              <div className="breakdown-item pending">
                <div className="breakdown-label">
                  <span>Pending</span>
                  <span className="percentage">{stats.totalPosts > 0 ? ((stats.pendingPosts / stats.totalPosts) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="breakdown-bar">
                  <div className="bar-fill pending-fill" style={{ width: `${stats.totalPosts > 0 ? ((stats.pendingPosts / stats.totalPosts) * 100) : 0}%` }}></div>
                </div>
                <span className="breakdown-count">{stats.pendingPosts} posts</span>
              </div>

              <div className="breakdown-item rejected">
                <div className="breakdown-label">
                  <span>Rejected</span>
                  <span className="percentage">{stats.totalPosts > 0 ? ((stats.rejectedPosts / stats.totalPosts) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="breakdown-bar">
                  <div className="bar-fill rejected-fill" style={{ width: `${stats.totalPosts > 0 ? ((stats.rejectedPosts / stats.totalPosts) * 100) : 0}%` }}></div>
                </div>
                <span className="breakdown-count">{stats.rejectedPosts} posts</span>
              </div>
            </div>
          </div>

          {/* FLAGGED POSTS MANAGEMENT */}
          <div className="flagged-section">
            <h2 className="section-title">
              <AlertCircle size={20} /> Flagged Posts by Experts ({flaggedPosts.length})
            </h2>
            {flaggedPosts.length === 0 ? (
              <div className="empty-state">No flagged posts. All posts are good!</div>
            ) : (
              <div className="flagged-posts-list">
                {flaggedPosts.map((post) => (
                  <div key={post._id} className="flagged-post-item">
                    <div className="post-info">
                      <h4>{post.title}</h4>
                      <p>{post.content.substring(0, 120)}...</p>
                      <div className="post-details">
                        <span className="detail-badge">By: {post.fullName}</span>
                        <span className="detail-badge">Flagged: {new Date(post.flaggedAt).toLocaleDateString()}</span>
                        <span className="detail-badge flag-reason">Reason: {post.flagReason}</span>
                      </div>
                    </div>
                    <div className="post-actions">
                      <button 
                        className="delete-post-btn"
                        onClick={() => handleDeleteFlaggedPost(post._id)}
                        disabled={deleting === post._id}
                        title="Delete this flagged post"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="confirm-modal">
              <div className="confirm-content">
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to permanently delete this flagged post?</p>
                <div className="confirm-buttons">
                  <button className="btn-cancel" onClick={cancelDelete}>Cancel</button>
                  <button 
                    className="btn-delete" 
                    onClick={confirmDeletePost}
                    disabled={deleting === deleteConfirm}
                  >
                    {deleting === deleteConfirm ? 'Deleting...' : 'Delete Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModerationDashboard;
