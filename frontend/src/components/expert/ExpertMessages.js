import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageCircle, AlertCircle, CheckCircle, Clock, Send, Loader } from 'lucide-react';
import '../user/Consultation.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ExpertMessages = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [selectedConsult, setSelectedConsult] = useState(null);
  const [responseTexts, setResponseTexts] = useState({}); // Track response per consultation ID
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const expertId = localStorage.getItem('userId');
  const _expertName = localStorage.getItem('userName');

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      // Fetch consultations for this expert (unassigned or assigned to them)
      const res = await axios.get(`${API_BASE}/api/reports/expert/${expertId}`);
      const consultations = res.data || [];
      
      setConsultations(consultations);
      console.log(`Loaded ${consultations.length} consultations for expert ${expertId}`);
    } catch (err) {
      console.error('Failed to load consultations', err);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (consultId) => {
    try {
      await axios.patch(`${API_BASE}/api/reports/${consultId}`, { status: 'in-progress' });
      setConsultations(consultations.map(c => 
        c._id === consultId ? { ...c, status: 'in-progress' } : c
      ));
    } catch (err) {
      console.error(err);
      alert('Failed to accept consultation');
    }
  };

  const handleSubmitResponse = async (e, consultId) => {
    e.preventDefault();
    const responseMessage = responseTexts[consultId];
    
    if (!responseMessage?.trim()) {
      alert('Please enter a response');
      return;
    }

    setSubmittingResponse(true);
    try {
      const url = `${API_BASE}/api/reports/${consultId}/respond`;
      console.log('Submitting response to:', url, { expertId, messageLength: responseMessage.length });
      const res = await axios.post(url, {
        responseMessage: responseMessage,
        expertId: expertId
      });
      
      console.log('Response submitted successfully:', res.data);
      // Update consultations with the new response
      setConsultations(consultations.map(c => 
        c._id === consultId ? res.data.report : c
      ));
      
      setResponseTexts({ ...responseTexts, [consultId]: '' });
      setSelectedConsult(null);
    } catch (err) {
      console.error('Failed to submit response:', err.response?.data || err.message);
      console.error('Error details:', err);
      alert('Failed to submit response: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingResponse(false);
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
      case 'new': return <AlertCircle size={16} />;
      case 'in-progress': return <Clock size={16} />;
      case 'resolved': return <CheckCircle size={16} />;
      default: return <MessageCircle size={16} />;
    }
  };

  const filteredList = consultations.filter(c => 
    filter === 'all' || c.status === filter
  );

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading consultations...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 700, color: '#1f2937' }}>
          Farmer & User Consultations
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
          Review and respond to consultation requests from farmers and users.
        </p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 24 }}>
            {consultations.filter(c => c.status === 'new').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>New Requests</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 24 }}>
            {consultations.filter(c => c.status === 'in-progress').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>In Progress</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: 24 }}>
            {consultations.filter(c => c.status === 'resolved').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Resolved</div>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['new', 'in-progress', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              background: filter === f ? '#10b981' : '#e5e7eb',
              color: filter === f ? 'white' : '#1f2937',
              transition: 'all 0.2s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* CONSULTATIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredList.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 32, 
            background: 'white', 
            borderRadius: 8,
            color: '#6b7280'
          }}>
            <MessageCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No {filter === 'all' ? '' : filter} consultations yet.</p>
          </div>
        ) : (
          filteredList.map(consult => (
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
              onClick={() => setSelectedConsult(selectedConsult?._id === consult._id ? null : consult)}
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
                      From: {consult.reporterId?.fullName || 'User'} ({consult.reporterRole})
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {consult.status}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {new Date(consult.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* EXPANDED DETAILS */}
              {selectedConsult?._id === consult._id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  {/* USER QUESTION */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                      User Question
                    </div>
                    <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 13, color: '#1f2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {consult.message}
                    </div>
                  </div>

                  {/* EXPERT RESPONSE (if exists) */}
                  {consult.responseMessage && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', marginBottom: 6, textTransform: 'uppercase' }}>
                        ✓ Your Response
                      </div>
                      <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6, fontSize: 13, color: '#166534', lineHeight: 1.6, whiteSpace: 'pre-wrap', borderLeft: '3px solid #10b981' }}>
                        {consult.responseMessage}
                      </div>
                    </div>
                  )}

                  {/* RESPONSE FORM (only for new & in-progress) */}
                  {!consult.responseMessage && consult.status !== 'resolved' && (
                    <form onSubmit={(e) => handleSubmitResponse(e, consult._id)} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 12 }}>
                      {consult.status === 'new' && (
                        <div style={{ 
                          background: '#fef3c7',
                          border: '1px solid #fcd34d',
                          padding: 12,
                          borderRadius: 6,
                          marginBottom: 12,
                          fontSize: 13,
                          color: '#92400e'
                        }}>
                          Accept this consultation first to provide your response.
                        </div>
                      )}

                      {consult.status === 'in-progress' && (
                        <>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', marginBottom: 8, display: 'block' }}>
                            Your Response
                          </label>
                          <textarea
                            value={responseTexts[consult._id] || ''}
                            onChange={(e) => setResponseTexts({ ...responseTexts, [consult._id]: e.target.value })}
                            placeholder="Provide your expert advice and guidance to the farmer/user..."
                            style={{
                              width: '100%',
                              padding: 12,
                              border: '1px solid #d1d5db',
                              borderRadius: 6,
                              fontSize: 13,
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              minHeight: 100,
                              marginBottom: 12
                            }}
                            maxLength={2000}
                          />
                          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
                            {(responseTexts[consult._id] || '').length}/2000 characters
                          </div>
                          <button
                            type="submit"
                            disabled={submittingResponse}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              background: submittingResponse ? '#d1d5db' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 600,
                              cursor: submittingResponse ? 'not-allowed' : 'pointer',
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8
                            }}
                          >
                            {submittingResponse ? (
                              <>
                                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                Submit Response
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </form>
                  )}

                  {/* ACTION BUTTONS */}
                  {consult.status === 'new' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(consult._id);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      Accept Consultation
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpertMessages;