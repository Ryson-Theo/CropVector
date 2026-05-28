import React, { useState, useEffect, useRef } from "react";
import { 
  User, Mail, MapPin, Phone, Home, FileText, 
  Edit3, Check, Camera, ShieldCheck, ExternalLink, Upload, Briefcase
} from "lucide-react";
import axios from "axios";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";

const ExpertProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", place: "", address: "",
    specialization: "", experience: "", status: "", 
    license: null, profilePic: ""
  });
  const hasFetched = useRef(false);

  // Load profile from Backend
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("userEmail");
        const res = await axios.get(`http://localhost:5000/api/auth/profile?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Extract data from the 'details' object returned by authController.getProfile
        const userData = res.data;
        const detailData = res.data.details || {};
        const licensePath = detailData.license || detailData.qualification || null;

        setProfile({
          ...userData,
          phone: detailData.phone || "",
          place: detailData.place || "",
          address: detailData.address || "",
          specialization: detailData.specialization || "",
          experience: detailData.experience || "",
          license: licensePath,
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
    formData.append("place", profile.place);
    formData.append("phone", profile.phone);
    formData.append("address", profile.address);
    formData.append("specialization", profile.specialization);
    formData.append("experience", profile.experience);

    if (profile.profilePic instanceof File) {
      formData.append("profilePic", profile.profilePic);
    }
    if (profile.license instanceof File) {
      formData.append("qualification", profile.license);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch("http://localhost:5000/api/auth/profile/update", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        }
      });
      
      // Update local state with the newly returned data
      const updatedUser = res.data.user;
      const updatedDetails = res.data.details;
      const updatedLicense = updatedDetails?.license || updatedDetails?.qualification || null;
      setProfile(prev => ({
        ...prev,
        ...updatedUser,
        phone: updatedDetails?.phone || "",
        place: updatedDetails?.place || "",
        address: updatedDetails?.address || "",
        specialization: updatedDetails?.specialization || "",
        experience: updatedDetails?.experience || "",
        license: updatedLicense,
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
              alt="Expert" 
            />
            {isEditing && (
              <label className="avatar-edit-label">
                <Camera size={16} />
                <input type="file" hidden onChange={(e) => setProfile({...profile, profilePic: e.target.files[0]})} />
              </label>
            )}
            <div className={`verification-badge ${profile.status === 'approved' ? 'bg-green-600' : 'bg-orange-500'}`}>
              <ShieldCheck size={14} /> {profile.status === 'approved' ? "Verified Expert" : "Pending Approval"}
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
              <h1 className="display-name">{profile.fullName || "Expert Name"}</h1>
            )}
            <p className="display-role text-green-700 font-bold">Agricultural Expert</p>
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
              <h3 className="section-label">Professional Information</h3>
              <div className="info-row">
                <Briefcase size={18} className="icon-muted" />
                {isEditing ? (
                    <input value={profile.specialization} onChange={(e) => setProfile({...profile, specialization: e.target.value})} placeholder="e.g. Agronomy, Pest Management" />
                ) : (
                    <span>{profile.specialization || "No specialization added"}</span>
                )}
              </div>
              <div className="info-row">
                <User size={18} className="icon-muted" />
                {isEditing ? (
                    <input type="number" value={profile.experience} onChange={(e) => setProfile({...profile, experience: e.target.value})} placeholder="Years of experience" />
                ) : (
                    <span>{profile.experience ? `${profile.experience} years experience` : "No experience added"}</span>
                )}
              </div>
            </div>

            <div className="info-section">
              <h3 className="section-label">Location & Office Details</h3>
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
                    <textarea value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} placeholder="Office/Professional Address" />
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
                <p className="license-title">Professional Qualification / Certification</p>
                <p className="license-subtitle">{profile.license ? "Status: Document Uploaded" : "Status: Missing Documents"}</p>
              </div>
            </div>
            <div className="license-actions">
              {profile.license && (
                <a 
                  href={getFileUrl(profile.license)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-view-light"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <ExternalLink size={16}/> View Doc
                </a>
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
      </div>
    </div>
  );
};

export default ExpertProfile;