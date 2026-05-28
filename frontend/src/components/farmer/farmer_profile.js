import React, { useState, useEffect } from "react";
import { 
  Mail, MapPin, Phone, Home, FileText, 
  Edit3, Check, Camera, ShieldCheck, ExternalLink, Upload, X
} from "lucide-react";
import axios from "axios";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";

const FarmerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const [viewDoc, setViewDoc] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", place: "", address: "",
    status: "", license: null, profilePic: ""
  });

  // Load profile from Backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("userEmail");
        const res = await axios.get(`http://localhost:5000/api/auth/profile?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // FIX: Extract data from the 'details' object returned by authController.getProfile
        const userData = res.data;
        const detailData = res.data.details || {};

        setProfile({
          ...userData,
          phone: detailData.phone || "",
          place: detailData.place || "",
          address: detailData.address || "",
          license: detailData.license || null,
          // Ensure profilePic is handled if it's in userData
          profilePic: userData.profilePic || ""
        });
      } catch (err) { 
        console.error("Fetch error", err); 
        setProfile(prev => ({
            ...prev,
            fullName: localStorage.getItem("userName"),
            email: localStorage.getItem("userEmail"),
            status: localStorage.getItem("userStatus")
        }));
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    
    // Append text data
    formData.append("fullName", profile.fullName);
    formData.append("email", profile.email); // Required for backend to find the user
    formData.append("phone", profile.phone);
    formData.append("place", profile.place);
    formData.append("address", profile.address);

    if (profile.profilePic instanceof File) {
      formData.append("profilePic", profile.profilePic);
    }
    if (profile.license instanceof File) {
      formData.append("license", profile.license);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch("http://localhost:5000/api/auth/profile/update", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        }
      });
      
      // Update local state with the newly returned data (flatten it again)
      const updatedUser = res.data.user;
      // Note: Backend updateProfile might not return details immediately, 
      // so we keep the local profile values that were just sent.
      setProfile(prev => ({
        ...prev,
        ...updatedUser
      }));

      localStorage.setItem("userName", updatedUser.fullName);
      setIsEditing(false);
      addToast("Profile updated successfully!", "success");
    } catch (err) { 
      console.error("Update error", err);
      addToast("Update failed. Please try again.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const getFileUrl = (fileField) => {
    if (!fileField) return null;
    if (fileField instanceof File) return URL.createObjectURL(fileField);
    if (typeof fileField === 'string' && fileField.startsWith("http")) return fileField;
    return `http://localhost:5000/${fileField.replace(/\\/g, '/')}`;
  };

  return (
    <div className="profile-wrapper">
      <Toast toasts={toasts} removeToast={removeToast} />
      {/* ... ( JSX remains exactly the same) ... */}
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
            <img 
              src={getFileUrl(profile.profilePic) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`} 
              className="main-avatar" 
              alt="Farmer" 
            />
            {isEditing && (
              <label className="avatar-edit-label">
                <Camera size={16} />
                <input type="file" hidden onChange={(e) => setProfile({...profile, profilePic: e.target.files[0]})} />
              </label>
            )}
            <div className={`verification-badge ${profile.status === 'approved' ? 'bg-green-600' : 'bg-orange-500'}`}>
              <ShieldCheck size={14} /> {profile.status === 'approved' ? "Verified Farmer" : "Pending Approval"}
            </div>
          </div>

          <div className="profile-identity">
            {isEditing ? (
              <input 
                className="edit-input-title" 
                value={profile.fullName} 
                onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
              />
            ) : (
              <h1 className="display-name">{profile.fullName || "Farmer Name"}</h1>
            )}
            <p className="display-role text-green-700 font-bold">Agriculture Specialist</p>
          </div>

          <div className="info-grid">
            <div className="info-section">
              <h3 className="section-label">Contact & Identity</h3>
              <div className="info-row"><Mail size={18} className="icon-muted" /><span>{profile.email}</span></div>
              <div className="info-row">
                <Phone size={18} className="icon-muted" />
                {isEditing ? (
                    <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} placeholder="Phone number" />
                ) : (
                    <span>{profile.phone || "No phone added"}</span>
                )}
              </div>
            </div>

            <div className="info-section">
              <h3 className="section-label">Farm Location</h3>
              <div className="info-row">
                <MapPin size={18} className="icon-muted" />
                {isEditing ? (
                    <input value={profile.place} onChange={(e) => setProfile({...profile, place: e.target.value})} placeholder="City, State" />
                ) : (
                    <span>{profile.place || "No location added"}</span>
                )}
              </div>
              <div className="info-row align-start">
                <Home size={18} className="icon-muted" />
                {isEditing ? (
                    <textarea value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} placeholder="Detailed Farm Address" />
                ) : (
                    <span className="address-text">{profile.address || "No address added"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="license-credential-card">
            <div className="license-info">
              <div className="license-icon-box"><FileText size={24} className="text-green-600" /></div>
              <div>
                <p className="license-title">Farmer License / Certification</p>
                <p className="license-subtitle">{profile.license ? "Status: Document Uploaded" : "Status: Missing Documents"}</p>
              </div>
            </div>
            <div className="license-actions">
              {profile.license && (
                <button 
                  type="button"
                  onClick={() => setViewDoc(getFileUrl(profile.license))}
                  className="btn-view-light"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', border: 'none', background: 'transparent', color: '#16a34a', fontSize: '0.9rem' }}
                >
                  <ExternalLink size={16}/> View Doc
                </button>
              )}
              {isEditing && (
                <label className="btn-update-doc cursor-pointer">
                  <Upload size={16}/> {profile.license ? "Replace Doc" : "Upload Doc"}
                  <input type="file" hidden onChange={(e) => setProfile({...profile, license: e.target.files[0]})} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Document Viewer Modal */}
        {viewDoc && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setViewDoc(null)}>
            <div style={{background:'white', borderRadius:'12px', width:'90%', maxWidth:'900px', height:'80vh', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden'}} onClick={e => e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px', borderBottom:'1px solid #eee'}}>
                <h3 style={{margin:0, fontSize:'1.2rem'}}>Document Viewer</h3>
                <button onClick={() => setViewDoc(null)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24} /></button>
              </div>
              <div style={{flex:1, background:'#f3f4f6', padding:'16px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <iframe src={viewDoc} title="Document" style={{width:'100%', height:'100%', border:'none', background: 'white'}} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerProfile;