import React, { useState, useEffect } from "react";
import {
  Users, Trash2, Search, 
  CheckCircle, FileText, MapPin, ExternalLink, XCircle, Phone, Home, Briefcase
} from "lucide-react";
import { fetchOnce, clearCachedData } from '../../utils/requestCache';

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); 

  // 1. Fetch data from  backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await fetchOnce('admin/users', async () => {
        const res = await fetch("http://localhost:5000/api/auth/admin/users", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        return await res.json();
      }, 30 * 1000);
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Action Handlers (Approve/Reject/Delete)
  const handleAction = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/auth/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        clearCachedData('admin/users');
        fetchUsers();
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  // 3. Search and Filter Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") {
      return matchesSearch;
    }
    if (filter === "farmer_requests") {
      return matchesSearch && u.role === "farmer" && u.status === "pending";
    }
    if (filter === "expert_requests") {
      return matchesSearch && u.role === "expert" && u.status === "pending";
    }
    if (filter === "buyer_requests") {
      return matchesSearch && u.role === "buyer" && u.status === "pending";
    }
    return matchesSearch;
  });

  if (loading) return <div className="p-10 text-center">Connecting to Server...</div>;

  return (
    <div className="user-management-page">
      <div className="card mb-4">
        <div className="user-mgmt-header">
          <h2 className="card-title flex items-center gap-2">
            <Users size={22} className="text-blue-600" /> User Directory
          </h2>
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" className="mgmt-search-input" placeholder="Search by name or email..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="tab-container">
        <button onClick={() => setFilter("all")} className={`tab-btn ${filter === 'all' ? 'active' : ''}`}>
          All Users
        </button>
        <button onClick={() => setFilter("farmer_requests")} className={`tab-btn ${filter === 'farmer_requests' ? 'active' : ''}`}>
          Farmer Requests ({users.filter(u => u.role === 'farmer' && u.status === 'pending').length})
        </button>
        <button onClick={() => setFilter("expert_requests")} className={`tab-btn ${filter === 'expert_requests' ? 'active' : ''}`}>
          Expert Requests ({users.filter(u => u.role === 'expert' && u.status === 'pending').length})
        </button>
        <button onClick={() => setFilter("buyer_requests")} className={`tab-btn ${filter === 'buyer_requests' ? 'active' : ''}`}>
          Buyer Requests ({users.filter(u => u.role === 'buyer' && u.status === 'pending').length})
        </button>
      </div>

      <div className="user-grid">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className="user-card-new">
              <div className="user-card-top">
                <div className="user-profile-info">
                  <img 
                    src={user.profilePic?.startsWith('http') ? user.profilePic : `http://localhost:5000/${user.profilePic?.replace(/\\/g, '/')}`} 
                    className="user-img-lg" alt="User"
                  />
                  <div>
                    <h4 className="user-name-text">{user.fullName}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`role-tag ${user.role}`}>{user.role}</span>
                        {/* Display Business Type if it exists in the details object */}
                        {user.details?.businessType && (
                            <span className="role-tag business flex items-center gap-1">
                                <Briefcase size={10}/> {user.details.businessType}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className={`status-indicator ${user.status}`}>{user.status}</div>
              </div>

              <div className="user-details-body">
                <div className="detail-item"><FileText size={14}/> {user.email}</div>
                
                {/* Updated to check nested details object for location */}
                <div className="detail-item">
                    <MapPin size={14}/> {user.details?.place || user.place || 'No Location'}
                </div>
                
                <div className="detail-extra">
                    {/* Updated to check nested details object for phone/address */}
                    <div className="detail-item">
                        <Phone size={12}/> {user.details?.phone || user.phone || 'N/A'}
                    </div>
                    <div className="detail-item">
                        <Home size={12}/> {user.details?.address || user.address || 'N/A'}
                    </div>
                </div>
              </div>

              {/* Enhanced logic to view documents from the details object */}
              {((user.role === 'farmer' || user.role === 'buyer') && (user.license || user.details?.license)) || 
               (user.role === 'expert' && (user.license || user.details?.license)) ? (
                <button 
                  onClick={async () => {
                    try {
                      const docPath = user.details?.license || user.license;
                      const fileUrl = `http://localhost:5000/${docPath.replace(/\\/g, '/')}`;
                      const response = await fetch(fileUrl);
                      const blob = await response.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank');
                    } catch (err) {
                      console.error("Error opening document:", err);
                      alert("Could not open document file.");
                    }
                  }}
                  className="license-link-btn"
                >
                  <ExternalLink size={14} /> VIEW DOCS (PDF/IMG)
                </button>
              ) : null}

              <div className="user-card-footer">
                <div className="action-group">
                  {user.status === 'pending' && (
                    <button onClick={() => handleAction(user._id, 'approve')} className="icon-action-btn approve" title="Approve"><CheckCircle size={18} /></button>
                  )}
                  <button onClick={() => handleAction(user._id, 'reject')} className="icon-action-btn block" title="Reject"><XCircle size={18} /></button>
                </div>
                {user.role !== 'admin' && (
                  <button onClick={() => handleAction(user._id, 'delete')} className="icon-action-btn delete" title="Delete"><Trash2 size={18} /></button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManagementView;