import React, { useEffect, useState } from "react";
import axios from "axios";
import { Send, AlertCircle, CheckCircle, Loader, Clock, Eye, MessageSquare, FileText, Timer } from "lucide-react";
import "./Consultation.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Consultation = ({ userRole }) => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedExpert, setSelectedExpert] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myConsultations, setMyConsultations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("form"); // form or history
  const [expandedConsult, setExpandedConsult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  const userId = localStorage.getItem("userId");

  const REPORT_TYPES = [
    { value: "bad-review", label: "Bad Expert Review/Response" },
    { value: "language-issue", label: "Language or Communication Problem" },
    { value: "incorrect-advice", label: "Incorrect or Harmful Advice" },
    { value: "expert-behavior", label: "Expert Behavior or Conduct Issue" },
    { value: "technical-bug", label: "Technical Bug or Platform Issue" },
    { value: "other", label: "Other Issue" }
  ];

  // Fetch experts on load
  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/auth/admin/experts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setExperts(res.data || []);
      } catch (err) {
        console.error("Failed to load experts", err.response?.data || err.message);
        setExperts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  // Fetch user's consultations
  useEffect(() => {
    if (userId && activeTab === "history") {
      fetchMyConsultations();
    }
  }, [userId, activeTab]);

  const fetchMyConsultations = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE}/api/reports/by/${userId}`);
      const consultations = (res.data || []).filter(r => r.type === 'consultation');
      setMyConsultations(consultations);
    } catch (err) {
      console.error("Failed to load consultation history", err);
      setMyConsultations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    
    try {
      if (!userId) {
        setError("User not authenticated. Please log in again.");
        setSubmitting(false);
        return;
      }

      const payload = {
        reporterId: userId,
        reporterRole: localStorage.getItem("userRole") || userRole || "user",
        expertId: selectedExpert || null,
        subject,
        message,
        type: "consultation"
      };

      console.log("Submitting consultation:", payload);
      const res = await axios.post(`${API_BASE}/api/reports`, payload);

      if (res.status === 201 || res.status === 200) {
        setSuccess("Consultation request submitted successfully! Experts will be notified soon.");
        setSubject("");
        setMessage("");
        setSelectedExpert("");
        setTimeout(() => {
          setSuccess("");
          // Fetch updated history
          if (activeTab === "history") {
            fetchMyConsultations();
          }
        }, 2000);
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      console.error("Consultation submission error:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to submit consultation request";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportType) {
      alert("Please select a report type");
      return;
    }
    if (!reportMessage.trim()) {
      alert("Please describe your issue");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE}/api/reports`, {
        reporterId: userId,
        reporterRole: localStorage.getItem("userRole") || userRole || "user",
        subject: REPORT_TYPES.find(t => t.value === reportType)?.label || reportType,
        message: reportMessage,
        type: "issue"
      });
      setSuccess("Report submitted. Admin will review it shortly.");
      setShowReportModal(false);
      setReportType("");
      setReportMessage("");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || "Failed to send report";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <AlertCircle size={14} />;
      case 'in-progress': return <Clock size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      default: return <Eye size={14} />;
    }
  };

  return (
    <div className="consultation-container">
      {/* HEADER */}
      <div className="consultation-header">
        <div>
          <h1>Expert Consultation</h1>
          <p>Ask verified experts for guidance on crops, diseases, pest management, and farm operations.</p>
        </div>
        <div className="consultation-stat">
          <div className="stat-value" style={{ color: "white" }}>{experts.length}</div>
          <div className="stat-label" style={{ color: "white" }}>Experts Available</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("form")}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'form' ? '#10b981' : '#e5e7eb',
            color: activeTab === 'form' ? 'white' : '#1f2937',
            transition: 'all 0.2s'
          }}
        >
          <Send size={16} style={{ display: 'inline-block', marginRight: 8 }} />
          New Consultation
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'history' ? '#10b981' : '#e5e7eb',
            color: activeTab === 'history' ? 'white' : '#1f2937',
            transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={16} style={{ display: 'inline-block', marginRight: 8 }} />
          My Consultations ({myConsultations.length})
        </button>
      </div>

      {/* FORM TAB */}
      {activeTab === "form" && (
        <div className="consultation-card">
          <form onSubmit={handleSubmit} className="consultation-form">
            {/* SELECT EXPERT */}
            <div className="form-group">
              <label htmlFor="expert">Select Expert (Optional)</label>
              <div className="input-group">
                {loading ? (
                  <div className="loading-select">Loading experts...</div>
                ) : experts.length === 0 ? (
                  <div className="no-experts">No experts found yet. You can still submit a consultation request and our team will assign one.</div>
                ) : (
                  <select
                    id="expert"
                    value={selectedExpert}
                    onChange={(e) => setSelectedExpert(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Any Available Expert</option>
                    {experts.map((ex) => (
                      <option key={ex._id} value={ex.userId}>
                        {ex.fullName} • {ex.details?.specialization || "General Expert"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <small>If you don't select an expert, your request goes to any available expert.</small>
            </div>

            {/* SUBJECT */}
            <div className="form-group">
              <label htmlFor="subject">Topic / Problem</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Crop disease in my field, Pest management advice"
                className="form-input"
                maxLength={100}
                required
              />
              <small>{subject.length}/100 characters</small>
            </div>

            {/* MESSAGE */}
            <div className="form-group">
              <label htmlFor="message">Question / Details</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your problem or question in detail. Share any relevant information about your crops, location, recent activities, etc."
                className="form-textarea"
                rows={7}
                maxLength={1000}
                required
              />
              <small>{message.length}/1000 characters</small>
            </div>

            {/* ALERTS */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            {/* BUTTONS */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader size={16} className="spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Consultation
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReport}
                className="btn btn-secondary"
              >
                <AlertCircle size={16} />
                Report Issue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Loader size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p>Loading consultations...</p>
            </div>
          ) : myConsultations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 32,
              background: 'white',
              borderRadius: 8,
              color: '#6b7280'
            }}>
              <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No consultations yet. Submit one above to get started!</p>
            </div>
          ) : (
            myConsultations.map(consult => (
              <div
                key={consult._id}
                style={{
                  background: 'white',
                  border: `1px solid ${getStatusColor(consult.status)}`,
                  borderLeft: `4px solid ${getStatusColor(consult.status)}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                onClick={() => setExpandedConsult(expandedConsult?._id === consult._id ? null : consult)}
              >
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: getStatusColor(consult.status), fontWeight: 600 }}>
                      {getStatusIcon(consult.status)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1f2937' }}>
                        {consult.subject}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        Requested {new Date(consult.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      background: getStatusColor(consult.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4
                    }}>
                      {consult.status}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                {expandedConsult?._id === consult._id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                    {/* USER QUESTION */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                        Your Question
                      </div>
                      <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 13, color: '#1f2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {consult.message}
                      </div>
                    </div>

                    {/* EXPERT RESPONSE (if resolved) */}
                    {consult.responseMessage && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', marginBottom: 6, textTransform: 'uppercase' }}>
                          Expert Response
                        </div>
                        <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6, fontSize: 13, color: '#166534', lineHeight: 1.6, whiteSpace: 'pre-wrap', borderLeft: '3px solid #10b981' }}>
                          {consult.responseMessage}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
                          Responded on {new Date(consult.respondedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* STATUS MESSAGE */}
                    {consult.status === 'in-progress' && !consult.responseMessage && (
                      <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#1e40af'
                      }}>
                        <strong>Expert is reviewing your consultation.</strong>
                      </div>
                    )}

                    {consult.status === 'new' && (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #fcd34d',
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#92400e'
                      }}>
                        <strong>Awaiting expert acceptance.</strong> Your consultation is in the queue.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* INFO SECTION (show only in form tab) */}
      {activeTab === "form" && (
        <div className="consultation-info">
          <div className="info-card">
            <h3><FileText size={18} /> What to Include</h3>
            <ul>
              <li>Describe your problem clearly and concisely</li>
              <li>Include crop type, field location, and recent activities</li>
              <li>Mention any visible symptoms or changes</li>
              <li>Share weather conditions if relevant</li>
            </ul>
          </div>

          <div className="info-card">
            <h3><Timer size={18} /> Response Time</h3>
            <ul>
              <li>Expert responses typically arrive within 24-48 hours</li>
              <li>Urgent disease alerts may be prioritized</li>
              <li>You'll receive notifications when an expert responds</li>
              <li>Check your messages regularly for replies</li>
            </ul>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
              Report an Issue
            </h2>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: 14 }}>
              Help us improve the platform by reporting what went wrong.
            </p>

            {/* REPORT TYPE SELECT */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', marginBottom: 6, display: 'block' }}>
                Issue Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select an issue type --</option>
                {REPORT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* REPORT MESSAGE */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', marginBottom: 6, display: 'block' }}>
                Details
              </label>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Describe the issue in detail..."
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: 80,
                  boxSizing: 'border-box'
                }}
                maxLength={500}
              />
              <small style={{ color: '#6b7280' }}>{reportMessage.length}/500 characters</small>
            </div>

            {/* BUTTONS */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportType("");
                  setReportMessage("");
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={submitting || !reportType}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: submitting || !reportType ? '#d1d5db' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: submitting || !reportType ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {submitting ? (
                  <>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultation;
