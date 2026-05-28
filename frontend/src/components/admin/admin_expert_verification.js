import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldCheck, X, Trash2, Edit3, ExternalLink, FileText, Phone, MapPin, Home, Briefcase } from 'lucide-react';
import axios from 'axios';
import { fetchOnce, clearCachedData } from '../../utils/requestCache';
import './ExpertManagement.css';

const ExpertVerificationView = (props) => {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [experts, setExperts] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "", email: "", specialization: "Soil Science", place: "", phone: "", address: ""
    });

    // Fetch experts once on mount; filter is applied client-side
    useEffect(() => {
        fetchExperts();
    }, []);

    const fetchExperts = async () => {
        try {
            const token = localStorage.getItem("token");
            const data = await fetchOnce('admin/experts', async () => {
                const res = await axios.get("http://localhost:5000/api/auth/admin/experts", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return res.data;
            }, 30 * 1000);
            console.log("Experts fetched:", data);
            setExperts(data || []);
        } catch (err) {
            console.error("Error fetching experts:", err.response?.data || err.message);
            setExperts([]);
        }
    };

    const handleCreateExpert = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (editingId) {
                // Update existing expert
                await axios.patch(`http://localhost:5000/api/auth/admin/experts/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Expert updated successfully.");
            } else {
                // Create new expert
                const tempPassword = Math.random().toString(36).substring(2, 10);
                const payload = { ...formData, password: tempPassword };

                await axios.post("http://localhost:5000/api/auth/admin/create-expert", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Expert Account Created and credentials sent via email.");
            }
            setFormData({ fullName: "", email: "", specialization: "Soil Science", place: "", phone: "", address: "" });
            setEditingId(null);
            setShowForm(false);
                clearCachedData('admin/experts');
                fetchExperts();
        } catch (err) {
            alert(err.response?.data?.message || "Error processing expert.");
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = async (expertId) => {
        if (!window.confirm("Delete this expert?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/auth/admin/experts/${expertId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Expert deleted successfully.");
            clearCachedData('admin/experts');
            fetchExperts();
        } catch (err) {
            alert("Error deleting expert.");
        }
    };

    const handleEdit = (expert) => {
        setEditingId(expert._id);
        setFormData({
            fullName: expert.fullName,
            email: expert.email,
            specialization: expert.details?.specialization || "Soil Science",
            place: expert.details?.place || "",
            phone: expert.details?.phone || "",
            address: expert.details?.address || ""
        });
        setShowForm(true);
    };

    const getFileUrl = (fileField) => {
        if (!fileField) return null;
        if (typeof fileField === 'string' && fileField.startsWith("http")) return fileField;
        return `http://localhost:5000/${fileField.replace(/\\/g, '/')}`;
    };

    const filteredExperts = experts.filter(expert => {
        if (filter === "pending") return expert.status === "pending";
        if (filter === "approved") return expert.status === "approved";
        return true;
    });

    return (
        <div className="expert-mgmt-container">
            <div className="mgmt-header">
                <div>
                    <h1>Expert Management</h1>
                    <p className="text-slate-500 mt-1">Manage and verify your network of agricultural specialists.</p>
                </div>
                <button 
                    className={`register-btn-toggle ${showForm ? 'active' : ''}`}
                    onClick={() => {
                        setShowForm(!showForm);
                        if (showForm) {
                            setEditingId(null);
                            setFormData({ fullName: "", email: "", specialization: "Soil Science", place: "", phone: "", address: "" });
                        }
                    }}
                >
                    {showForm ? <><X size={20} /> Close Form</> : <><UserPlus size={20} /> Add Expert</>}
                </button>
            </div>

            {showForm && (
                <div className="registration-card animate-in">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <ShieldCheck className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{editingId ? "Edit Expert" : "Add New Expert"}</h2>
                            <p className="text-sm text-slate-500">{editingId ? "Update expert details" : "The expert will receive an email with login credentials."}</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateExpert} className="form-grid">
                        <div className="input-box">
                            <label>Full Name</label>
                            <input type="text" placeholder="e.g. Dr. John Smith" required 
                                value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                        </div>
                        <div className="input-box">
                            <label>Official Email</label>
                            <input type="email" placeholder="john@cropvector.com" required 
                                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                disabled={editingId ? true : false} />
                        </div>
                        <div className="input-box">
                            <label>Specialization Area</label>
                            <input type="text" placeholder="e.g. Agronomy, Pest Management" 
                                value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} />
                        </div>
                        <div className="input-box">
                            <label>Location / Region</label>
                            <input type="text" placeholder="Kerala, India" 
                                value={formData.place} onChange={(e) => setFormData({...formData, place: e.target.value})} />
                        </div>
                        <div className="input-box">
                            <label>Phone</label>
                            <input type="text" placeholder="+91 XXXXXXXXXX" 
                                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="input-box">
                            <label>Office Address</label>
                            <input type="text" placeholder="123 Street, City" 
                                value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <button type="submit" className="submit-expert-btn" disabled={loading}>
                            {loading ? "Processing..." : editingId ? "Update Expert" : "Create Expert Account"}
                        </button>
                    </form>
                </div>
            )}

            <div className="queue-container">
                <div className="tab-container" style={{marginBottom: "20px"}}>
                    <button onClick={() => setFilter("pending")} className={`tab-btn ${filter === 'pending' ? 'active' : ''}`}>
                        Pending Approvals ({experts.filter(e => e.status === 'pending').length})
                    </button>
                    <button onClick={() => setFilter("approved")} className={`tab-btn ${filter === 'approved' ? 'active' : ''}`}>
                        Approved Experts ({experts.filter(e => e.status === 'approved').length})
                    </button>
                    <button onClick={() => setFilter("all")} className={`tab-btn ${filter === 'all' ? 'active' : ''}`}>
                        All Experts ({experts.length})
                    </button>
                </div>

                {filteredExperts.length === 0 ? (
                    <div className="empty-state">No experts found.</div>
                ) : (
                    <div className="expert-grid">
                        {filteredExperts.map((expert) => (
                            <div key={expert._id} className="expert-card">
                                <div className="expert-header">
                                    <img 
                                        src={getFileUrl(expert.profilePic) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.email}`}
                                        className="expert-avatar" 
                                        alt="Expert" 
                                    />
                                    <div className="expert-identity">
                                        <h3 className="expert-name">{expert.fullName}</h3>
                                        <span className={`status-badge ${expert.status}`}>{expert.status}</span>
                                    </div>
                                </div>

                                <div className="expert-details">
                                    <div className="detail"><FileText size={14}/> {expert.email}</div>
                                    <div className="detail"><Briefcase size={14}/> {expert.details?.specialization || 'N/A'}</div>
                                    <div className="detail"><MapPin size={14}/> {expert.details?.place || 'N/A'}</div>
                                    <div className="detail"><Phone size={14}/> {expert.details?.phone || 'N/A'}</div>
                                    <div className="detail"><Home size={14}/> {expert.details?.address || 'N/A'}</div>
                                </div>

                                {expert.details?.license && (
                                    <a 
                                        href={getFileUrl(expert.details.license)} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="view-doc-btn"
                                    >
                                        <ExternalLink size={14}/> View Qualification
                                    </a>
                                )}

                                <div className="expert-actions">
                                    <button 
                                        onClick={() => handleEdit(expert)}
                                        className="action-btn edit"
                                        title="Edit"
                                    >
                                        <Edit3 size={16}/> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(expert._id)}
                                        className="action-btn delete"
                                        title="Delete"
                                    >
                                        <Trash2 size={16}/> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpertVerificationView;