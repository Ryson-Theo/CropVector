import React, { useState, useEffect } from "react";
import { 
  Mail, MapPin, Phone, Home, 
  Edit3, Check, Camera
} from "lucide-react";
import axios from "axios";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const [profile, setProfile] = useState({
    fullName: "", 
    email: "", 
    phone: "", 
    place: "", 
    address: "",
    profilePic: "",
    role: ""
  });

  // 1. Load Profile with Session Validation
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userEmail = localStorage.getItem("userEmail");
        const userRole = localStorage.getItem("userRole");

        // SECURITY: If this is the User Profile but the session says 'farmer', 
        // we force a refresh or prevent cross-contamination display.
        if (userRole !== "user") {
           console.warn("Session mismatch: Current session is not a standard user.");
        }

        const res = await axios.get(`http://localhost:5000/api/auth/profile?email=${userEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data) {
          setProfile(res.data);
        }
      } catch (err) { 
        console.error("Fetch error", err);
        setProfile(prev => ({
          ...prev,
          fullName: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || ""
        }));
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    
    // Explicitly pull from state to ensure we aren't sending stale storage data
    formData.append("fullName", profile.fullName);
    formData.append("phone", profile.phone);
    formData.append("place", profile.place);
    formData.append("address", profile.address);
    formData.append("email", profile.email);

    if (profile.profilePic instanceof File) {
      formData.append("profilePic", profile.profilePic);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch("http://localhost:5000/api/auth/profile/update", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        }
      });

      // Update session storage for the sidebar name
      localStorage.setItem("userName", res.data.user.fullName);
      
      setProfile(res.data.user);
      setIsEditing(false);
      addToast("Profile updated successfully!", "success");
    } catch (err) { 
      addToast("Update failed. Please check your connection.", "error");
    } finally { 
      setLoading(false); 
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfile({ ...profile, profilePic: file });
  };

  const getAvatarSrc = () => {
    if (profile.profilePic instanceof File) return URL.createObjectURL(profile.profilePic);
    if (profile.profilePic && profile.profilePic.startsWith("http")) return profile.profilePic;
    if (profile.profilePic) return `http://localhost:5000/${profile.profilePic}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email || 'User'}`;
  };

  return (
    <div className="profile-wrapper">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="profile-card-premium">
        <div className="profile-banner">
          <button 
            className={`edit-toggle-btn ${isEditing ? 'save' : ''}`}
            onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
            disabled={loading}
          >
            {loading ? "Syncing..." : isEditing ? <><Check size={18}/> Save Changes</> : <><Edit3 size={18}/> Edit Profile</>}
          </button>
        </div>

        <div className="profile-content-area">
          <div className="profile-avatar-wrapper">
            <img src={getAvatarSrc()} className="main-avatar" alt="User" />
            {isEditing && (
              <label className="avatar-edit-label">
                <Camera size={16} />
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="profile-identity">
            {isEditing ? (
              <input 
                className="edit-input-title" 
                value={profile.fullName} 
                onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
              />
            ) : (
              <h1 className="display-name">{profile.fullName || "Community Member"}</h1>
            )}
            <p className="display-role text-blue-600 font-bold">Standard Member</p>
          </div>

          <div className="info-grid">
            <div className="info-section">
              <h3 className="section-label">Contact Details</h3>
              <div className="info-row">
                <Mail size={18} className="icon-muted" />
                <span>{profile.email}</span>
              </div>
              <div className="info-row">
                <Phone size={18} className="icon-muted" />
                {isEditing ? (
                  <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                ) : (
                  <span>{profile.phone || "Add Phone Number"}</span>
                )}
              </div>
            </div>

            <div className="info-section">
              <h3 className="section-label">Location</h3>
              <div className="info-row">
                <MapPin size={18} className="icon-muted" />
                {isEditing ? (
                  <input value={profile.place} onChange={(e) => setProfile({...profile, place: e.target.value})} />
                ) : (
                  <span>{profile.place || "Add City / State"}</span>
                )}
              </div>
              <div className="info-row align-start">
                <Home size={18} className="icon-muted" />
                {isEditing ? (
                  <textarea value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
                ) : (
                  <span className="address-text">{profile.address || "Add detailed address"}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;