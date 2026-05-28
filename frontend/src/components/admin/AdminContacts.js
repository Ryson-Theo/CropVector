import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchOnce } from '../../utils/requestCache';
import { Mail, Trash2, Calendar, User, MessageSquare } from 'lucide-react';
import './ExpertManagement.css'; // Reusing existing admin styles

const AdminContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
                const token = localStorage.getItem("token");
                const data = await fetchOnce('admin/contacts', async () => {
                    const res = await axios.get("http://localhost:5000/api/auth/admin/contacts", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    return res.data;
                }, 30 * 1000); // cache for 30s to avoid rapid refetch storms
                setContacts(data);
        } catch (err) {
            console.error("Error fetching contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/auth/admin/contacts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContacts(contacts.filter(c => c._id !== id));
        } catch (err) {
            alert("Failed to delete message");
        }
    };

    if (loading) return <div className="p-5">Loading messages...</div>;

    return (
        <div className="expert-mgmt-container">
            <div className="mgmt-header">
                <div>
                    <h1>Contact Messages</h1>
                    <p className="text-slate-500 mt-1">Inquiries from the contact form.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                    {contacts.length} Messages
                </div>
            </div>

            <div className="queue-container">
                {contacts.length === 0 ? (
                    <div className="empty-state">No messages found.</div>
                ) : (
                    <div className="expert-grid">
                        {contacts.map((msg) => (
                            <div key={msg._id} className="expert-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="expert-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <div className="expert-identity">
                                        <h3 className="expert-name" style={{ fontSize: '1.1rem' }}>{msg.subject}</h3>
                                        <span className="text-sm text-slate-500 flex items-center gap-1">
                                            <Calendar size={14} /> {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="expert-details" style={{ flex: 1 }}>
                                    <div className="detail">
                                        <User size={16} className="text-slate-400" /> 
                                        <strong>{msg.name}</strong>
                                    </div>
                                    <div className="detail">
                                        <Mail size={16} className="text-slate-400" /> 
                                        <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline">{msg.email}</a>
                                    </div>
                                    <div className="detail" style={{ alignItems: 'flex-start', marginTop: '10px' }}>
                                        <MessageSquare size={16} className="text-slate-400 mt-1" />
                                        <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-md w-full">
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="expert-actions" style={{ marginTop: 'auto', paddingTop: '15px' }}>
                                    <a 
                                        href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                                        className="action-btn edit"
                                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Mail size={16} /> Reply
                                    </a>
                                    <button 
                                        onClick={() => handleDelete(msg._id)}
                                        className="action-btn delete"
                                    >
                                        <Trash2 size={16} /> Delete
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

export default AdminContacts;