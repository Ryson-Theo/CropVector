import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Send, MessageCircle, Heart, Share2, MoreHorizontal, Search, Hash, Loader2, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import axios from "axios";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";
import "./CommunityFeed.css";

const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [postImage, setPostImage] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [postMenuOpen, setPostMenuOpen] = useState(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState(null);
  const observerRef = useRef(null);
  const viewedPostsRef = useRef(new Set()); // Track views globally, not in state
  const { toasts, addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const fetchPostsQuery = async () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedHashtag) params.hashtag = selectedHashtag;
    const res = await axios.get("http://localhost:5000/api/posts", { params });
    return res.data || [];
  };

  const fetchRecommendationsQuery = async () => {
    const res = await axios.get("http://localhost:5000/api/hashtags/recommendations");
    return res.data || [];
  };

  const fetchPendingPostsQuery = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/posts/pending", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.data || [];
  };

  const postsQuery = useQuery({
    queryKey: ["posts", searchTerm, selectedHashtag],
    queryFn: fetchPostsQuery,
    enabled: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const recommendationsQuery = useQuery({
    queryKey: ["hashtagsRecommendations"],
    queryFn: fetchRecommendationsQuery,
    enabled: true,
    staleTime: 10 * 60 * 1000,
    cacheTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const pendingPostsQuery = useQuery({
    queryKey: ["pendingPosts"],
    queryFn: fetchPendingPostsQuery,
    enabled: userRole === 'expert',
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  useEffect(() => {
    setPosts(postsQuery.data || []);
    viewedPostsRef.current.clear();
  }, [postsQuery.data]);

  useEffect(() => {
    setRecommendations(recommendationsQuery.data || []);
  }, [recommendationsQuery.data]);

  useEffect(() => {
    if (userRole === 'expert') {
      setPendingPosts(pendingPostsQuery.data || []);
    }
  }, [pendingPostsQuery.data, userRole]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const id = localStorage.getItem("userId");
    setUserRole(role);
    setUserId(id);
  }, []);

  // Setup Intersection Observer for auto-view increment on scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const postId = entry.target.getAttribute('data-post-id');
          // Only increment if we haven't already incremented this post
          if (postId && !viewedPostsRef.current.has(postId)) {
            incrementViewCount(postId);
            viewedPostsRef.current.add(postId); // Add to viewed set immediately
          }
        }
      });
    }, { threshold: 0.3 });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [posts]); // Re-run when posts change

  const incrementViewCount = async (postId) => {
    try {
      const postRes = await axios.post(`http://localhost:5000/api/posts/${postId}/views`);
      // Update the post in the posts array with the new view count
      setPosts(posts.map(post => post._id === postId ? { ...post, views: postRes.data.views } : post));
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedHashtag) params.hashtag = selectedHashtag;

      const res = await axios.get("http://localhost:5000/api/posts", { params });
      setPosts(res.data || []);
      viewedPostsRef.current.clear(); // Reset viewed posts when fetching new posts
    } catch (err) {
      console.error("Fetch Posts Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/posts/pending", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setPendingPosts(res.data || []);
    } catch (err) {
      console.error("Fetch Pending Posts Error:", err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/hashtags/recommendations");
      setRecommendations(res.data || []);
    } catch (err) {
      console.error("Recommendations Error:", err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPost.trim()) {
      addToast("Please fill in title and content", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", newPostTitle);
      formData.append("content", newPost);
      formData.append("hashtags", hashtags);
      formData.append("userId", userId);
      if (postImage) formData.append("postImage", postImage);

      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/posts/create", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setNewPost("");
      setNewPostTitle("");
      setHashtags("");
      setPostImage(null);
      addToast("Post created successfully!", "success");
      queryClient.invalidateQueries(["posts"]);
      queryClient.invalidateQueries(["hashtagsRecommendations"]);
    } catch (err) {
      console.error("Post creation error:", err.response?.data || err.message);
      addToast("Failed to create post: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/posts/${postId}/like`, { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries(["posts"]);
    } catch (err) {
      console.error("Like Error:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    // Prevent deletion if post was validated by expert
    const post = posts.find(p => p._id === postId);
    if (post?.isVerified || post?.isFlagged) {
      addToast("Cannot delete post after expert review", "error");
      return;
    }

    // Just show confirmation state
    setDeleteConfirmPostId(postId);
  };

  const executeDeletePost = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/posts/${deleteConfirmPostId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast("Post deleted successfully", "success");
      setDeleteConfirmPostId(null);
      queryClient.invalidateQueries(["posts"]);
    } catch (err) {
      console.error("Delete error:", err);
      addToast("Cannot delete post", "error");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmPostId(null);
    addToast("Delete cancelled", "info");
  };

  const startEdit = (post) => {
    if (post.isVerified || post.isFlagged) {
      addToast('Cannot edit post after expert review', 'error');
      return;
    }
    setEditingPostId(post._id);
    setEditTitle(post.title || "");
    setEditContent(post.content || "");
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async (postId) => {
    if (!editTitle.trim() || !editContent.trim()) {
      addToast('Title and content cannot be empty', 'warning');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/posts/${postId}`,
        { title: editTitle, content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cancelEdit();
      addToast('Post updated successfully', 'success');
      fetchPosts();
    } catch (err) {
      console.error('Save edit failed', err);
      addToast(err.response?.data?.error || 'Failed to save changes', 'error');
    }
  };

  const handleModeratePost = async (postId, action, note) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:5000/api/posts/${postId}/moderate`, 
        { action, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPendingPosts();
      fetchPosts();
      addToast(`Post ${action}d successfully!`, 'success');
    } catch (err) {
      console.error("Moderation error:", err.response?.data || err.message);
      addToast("Moderation failed: " + (err.response?.data?.error || err.message), 'error');
    }
  };

  const sharePost = async (post) => {
    const url = `${window.location.origin}/posts/${post._id}`;
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.content?.substring(0, 120), url });
        return;
      } catch (err) {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      addToast('Post link copied to clipboard', 'success');
    } catch (err) {
      // fallback
      prompt('Copy this link', url);
    }
  };

  const handleAddComment = async (postId) => {
    const content = commentText[postId];
    if (!content?.trim()) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, 
        { content, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText({ ...commentText, [postId]: "" });
      fetchComments(postId);
    } catch (err) {
      console.error("Comment Error:", err);
    }
  };

  const fetchComments = async (postId) => {
    try {
      // Increment views when viewing post comments (only if not already viewed in this session)
      if (!viewedPostsRef.current.has(postId)) {
        incrementViewCount(postId);
        viewedPostsRef.current.add(postId);
      }
      
      const res = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: res.data });
    } catch (err) {
      console.error("Fetch Comments Error:", err);
    }
  };

  return (
    <div className="community-feed">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmPostId && (
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
                onClick={cancelDelete}
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
                onClick={executeDeletePost}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* LEFT: Post Creator */}
      <div className="feed-left">
        {/* POST CREATOR */}
        <div className="post-creator">
          <div className="flex gap-3">
            <div className="creator-avatar">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="You" />
            </div>
            <div className="flex-1">
              <input 
                type="text"
                className="post-title-input"
                placeholder="Post title..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <textarea 
                className="post-input" 
                placeholder="Share your farming tips, questions, or experiences..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows="4"
              />
              <input 
                type="text"
                className="hashtag-input"
                placeholder="#agriculture #soil #pest (separate with spaces)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
              <div className="post-actions">
                <label className="file-upload-btn">
                  <Image size={18} /> Add Photo
                  <input type="file" accept="image/*" hidden onChange={(e) => setPostImage(e.target.files[0])} />
                </label>
                {postImage && <span className="file-name">{postImage.name}</span>}
                <button onClick={handleCreatePost} disabled={loading} className="submit-post-btn">
                  <Send size={16} /> {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* POSTS FEED */}
        <div className="posts-feed">
          {loading && <div className="loading"><Loader2 className="animate-spin" /> Loading posts...</div>}
          
          {posts.length === 0 && !loading && (
            <div className="empty-state">No posts yet. Be the first to share!</div>
          )}

          {posts.map((post) => {
            // Owner detection: Compare string IDs
            const ownerId = post.userId ? String(post.userId).trim() : null;
            const currentUserId = userId ? String(userId).trim() : null;
            const isOwner = !!(ownerId && currentUserId && ownerId === currentUserId);

            return (
            <div key={post._id} className="post-card" data-post-id={post._id} ref={(el) => {
              if (el && observerRef.current) observerRef.current.observe(el);
            }}>
              {/* HEADER */}
              <div className="post-header">
                <div className="post-author">
                  <img src={post.profilePic ? `http://localhost:5000/${post.profilePic}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.email}`} alt="Author" className="author-avatar" />
                  <div>
                    <div className="author-info">
                      <span className="author-name">{post.fullName}</span>
                      <span className={`role-badge ${post.userRole}`}>{post.userRole}</span>
                    </div>
                    <span className="post-time">{new Date(post.createdAt).toLocaleDateString()} • {post.views} views</span>
                  </div>
                </div>
                {
                  // Simple owner check with dropdown menu
                  (() => {
                    if (isOwner) {
                      return (
                        <div className="post-menu-wrapper">
                          <button 
                            className="post-menu-btn"
                            onClick={() => setPostMenuOpen(postMenuOpen === post._id ? null : post._id)}
                            title="Post options"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          {postMenuOpen === post._id && (
                            <div className="post-dropdown-menu">
                              {!post.isVerified && !post.isFlagged && (
                                <>
                                  <button 
                                    className="menu-item edit"
                                    onClick={() => {
                                      startEdit(post);
                                      setPostMenuOpen(null);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="menu-item delete"
                                    onClick={() => {
                                      handleDeletePost(post._id);
                                      setPostMenuOpen(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              {(post.isVerified || post.isFlagged) && (
                                <div className="menu-item disabled">Post is locked</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()
                }
              </div>

              {/* EXPERT BADGES */}
              {post.isVerified && (
                <div className="moderation-badge verified">
                  <CheckCircle size={14} /> Verified by {post.verifiedBy?.fullName || 'Expert'}
                </div>
              )}
              {post.isFlagged && (
                <div className="moderation-badge flagged">
                  <AlertCircle size={14} /> Flagged as Inaccurate by {post.flaggedBy?.fullName || 'Expert'}
                </div>
              )}

              {/* CONTENT */}
              <div className="post-content">
                {editingPostId === post._id ? (
                  <div className="edit-form">
                    <input className="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <textarea className="edit-content" value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} />
                    <div className="edit-actions">
                      <button className="save-btn" onClick={() => saveEdit(post._id)}>Save</button>
                      <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-text">{post.content}</p>
                    {post.image && <img src={`http://localhost:5000/${post.image}`} alt="Post" className="post-image" />}
                  </>
                )}
                
                {/* HASHTAGS */}
                <div className="post-hashtags">
                  {post.hashtags?.map((tag, idx) => (
                    <button key={idx} onClick={() => setSelectedHashtag(tag)} className="hashtag-pill">
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* ENGAGEMENT */}
              <div className="post-engagement">
                <button onClick={() => handleLikePost(post._id)} className="engagement-btn">
                  <Heart size={18} /> {post.likes}
                </button>
                <button onClick={() => fetchComments(post._id)} className="engagement-btn">
                  <MessageCircle size={18} /> {post.commentsCount}
                </button>
                <button onClick={() => sharePost(post)} className="engagement-btn">
                  <Share2 size={18} /> Share
                </button>
              </div>

              {/* COMMENTS SECTION */}
              {comments[post._id] && (
                <div className="comments-section">
                  {comments[post._id].map((comment) => (
                    <div key={comment._id} className="comment">
                      <img src={comment.profilePic ? `http://localhost:5000/${comment.profilePic}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.fullName}`} alt="Commenter" className="comment-avatar" />
                      <div className="comment-content">
                        <span className="comment-author">{comment.fullName}</span>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ADD COMMENT */}
              <div className="add-comment">
                <input 
                  type="text"
                  className="comment-input"
                  placeholder="Add a comment..."
                  value={commentText[post._id] || ""}
                  onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                />
                <button onClick={() => handleAddComment(post._id)} className="comment-btn">Post</button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="feed-right">
        {/* SEARCH */}
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={fetchPosts}
          />
        </div>

        {/* TRENDING HASHTAGS */}
        <div className="trending-box">
          <h3 className="trending-title"><TrendingUp size={18} /> Trending Hashtags</h3>
          {recommendations.map((tag) => (
            <button 
              key={tag.tag}
              onClick={() => {
                setSelectedHashtag(tag.tag);
                fetchPosts();
              }}
              className="trend-item"
            >
              <Hash size={14} />
              <div>
                <div className="trend-tag">{tag.tag}</div>
                <div className="trend-count">{tag.count} posts</div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CommunityFeed;
