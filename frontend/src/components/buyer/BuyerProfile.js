import React, { useState, useEffect } from "react";
import { 
  Mail, MapPin, Phone, Home, 
  Edit3, Check, Camera, ShieldCheck, ExternalLink, Upload, Briefcase, X
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

let cachedBuyerProfile = null;
let buyerProfilePromise = null;

const BuyerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", place: "", address: "",
    status: "", license: null, profilePic: "", businessType: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (cachedBuyerProfile) {
        setProfile(cachedBuyerProfile);
        return;
      }
      if (buyerProfilePromise) {
        const cached = await buyerProfilePromise;
        if (cached) setProfile(cached);
        return;
      }

      const promise = (async () => {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("userEmail");
        try {
          const res = await axios.get(`http://localhost:5000/api/auth/profile?email=${email}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const { details, ...baseUser } = res.data;
          const profileData = {
            ...baseUser,
            phone: details?.phone || "",
            place: details?.place || "",
            address: details?.address || "",
            businessType: details?.businessType || "Shop",
            license: details?.license || null
          };
          cachedBuyerProfile = profileData;
          return profileData;
        } catch (err) {
          console.error("Fetch error", err);
          const fallbackProfile = {
            ...profile,
            fullName: localStorage.getItem("userName"),
            email: localStorage.getItem("userEmail"),
            status: localStorage.getItem("userStatus")
          };
          cachedBuyerProfile = fallbackProfile;
          return fallbackProfile;
        }
      })();

      buyerProfilePromise = promise;
      try {
        const profileData = await promise;
        setProfile(profileData);
      } finally {
        buyerProfilePromise = null;
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("fullName", profile.fullName);
    formData.append("email", profile.email);
    formData.append("phone", profile.phone);
    formData.append("place", profile.place);
    formData.append("address", profile.address);
    formData.append("businessType", profile.businessType);

    if (profile.profilePic instanceof File) formData.append("profilePic", profile.profilePic);
    if (profile.license instanceof File) formData.append("license", profile.license);

    try {
      const token = localStorage.getItem("token");
      await axios.patch("http://localhost:5000/api/auth/profile/update", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        }
      });
      
      toast.success("Business Profile Updated");
      setIsEditing(false);
      window.location.reload(); 
    } catch (err) { 
      toast.error("Update failed."); 
    } finally { setLoading(false); }
  };

  const getFileUrl = (fileField) => {
    if (!fileField) return null;
    if (fileField instanceof File) return URL.createObjectURL(fileField);
    if (typeof fileField === 'string' && (fileField.startsWith("http") || fileField.startsWith("blob"))) return fileField;
    return `http://localhost:5000/${fileField}`;
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card-premium">
        <div className="profile-banner buyer-theme">
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
              className="main-avatar buyer-border" 
              alt="Buyer" 
            />
            {isEditing && (
              <label className="avatar-edit-label">
                <Camera size={16} />
                <input type="file" hidden onChange={(e) => setProfile({...profile, profilePic: e.target.files[0]})} />
              </label>
            )}
          </div>

          <div className="profile-identity">
            {/* 1. Verified Status First */}
            <div className="flex items-center gap-1 text-blue-600 mb-1">
              <ShieldCheck size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {profile.status === 'approved' ? "Verified Business" : "Pending Verification"}
              </span>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <select 
                  className="edit-input-title text-sm font-bold text-blue-700"
                  value={profile.businessType}
                  onChange={(e) => setProfile({...profile, businessType: e.target.value})}
                >
                  <option value="Shop">Retail Shop</option>
                  <option value="Restaurant">Restaurant / Hotel</option>
                  <option value="Wholesale">Wholesale Dealer</option>
                  <option value="Individual">Individual Bulk Buyer</option>
                </select>
                <input 
                  className="edit-input-title" 
                  value={profile.fullName} 
                  onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
                  placeholder="Business Name"
                />
              </div>
            ) : (
              <>
                {/* 2. Business Type moved UP */}
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={16} className="text-gray-500" />
                  <span className="text-sm font-extrabold text-blue-700 uppercase tracking-widest">
                    {profile.businessType || "Business"}
                  </span>
                </div>
                {/* 3. Name moved DOWN */}
                <h1 className="display-name" style={{ fontSize: '2rem', fontWeight: '900' }}>
                  {profile.fullName || "Business Representative"}
                </h1>
              </>
            )}
          </div>

          <div className="info-grid">
            <div className="info-section">
              <h3 className="section-label">Business Contact</h3>
              <div className="info-row"><Mail size={18} className="icon-muted" /><span>{profile.email}</span></div>
              <div className="info-row">
                <Phone size={18} className="icon-muted" />
                {isEditing ? <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} /> : <span>{profile.phone || "No phone added"}</span>}
              </div>
            </div>

            <div className="info-section">
              <h3 className="section-label">Warehouse / Office</h3>
              <div className="info-row">
                <MapPin size={18} className="icon-muted" />
                {isEditing ? <input value={profile.place} onChange={(e) => setProfile({...profile, place: e.target.value})} /> : <span>{profile.place || "Location not set"}</span>}
              </div>
              <div className="info-row align-start">
                <Home size={18} className="icon-muted" />
                {isEditing ? <textarea value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} /> : <span className="address-text">{profile.address || "Address not added"}</span>}
              </div>
            </div>
          </div>

          <div className="license-credential-card">
            <div className="license-info">
              <div className="license-icon-box"><Briefcase size={24} className="text-blue-600" /></div>
              <div>
                <p className="license-title">Trade License / GST Registration</p>
                <p className="license-subtitle">{profile.license ? "Status: Verified" : "Status: Document Required"}</p>
              </div>
            </div>
            <div className="license-actions">
              {profile.license && (
                <button 
                  type="button"
                  onClick={() => setViewDoc(getFileUrl(profile.license))}
                  className="btn-view-light"
                  style={{ cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#2563eb' }}
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

export default BuyerProfile;