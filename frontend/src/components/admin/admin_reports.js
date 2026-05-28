import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchOnce } from '../../utils/requestCache';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await fetchOnce('admin/reports', async () => {
        const res = await axios.get(`${API_BASE}/api/reports?type=issue`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        return res.data;
      }, 30 * 1000);
      setReports(data || []);
      console.log('Loaded reports:', data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      await axios.patch(`${API_BASE}/api/reports/${reportId}`, { status: newStatus });
      setReports(reports.map(r => 
        r._id === reportId ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error('Failed to update report:', err);
      alert('Failed to update report status');
    } finally {
      setUpdatingId(null);
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
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 700, color: '#1f2937' }}>
          User & Farmer Issue Reports
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
          Review and manage user-submitted issue reports from the platform.
        </p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 24 }}>
            {reports.filter(r => r.status === 'new').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>New Reports</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 24 }}>
            {reports.filter(r => r.status === 'in-progress').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>In Review</div>
        </div>
        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: 24 }}>
            {reports.filter(r => r.status === 'resolved').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Resolved</div>
        </div>
      </div>

      {/* REPORTS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reports.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 32,
            background: 'white',
            borderRadius: 8,
            color: '#6b7280'
          }}>
            <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No issue reports at this time.</p>
          </div>
        ) : (
          reports.map(report => (
            <div
              key={report._id}
              style={{
                background: 'white',
                border: `1px solid ${getStatusColor(report.status)}`,
                borderLeft: `4px solid ${getStatusColor(report.status)}`,
                borderRadius: 8,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              onClick={() => setExpandedReport(expandedReport?._id === report._id ? null : report)}
            >
              {/* HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: getStatusColor(report.status), fontWeight: 600 }}>
                    {getStatusIcon(report.status)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1f2937' }}>
                      {report.subject}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      From: {report.reporterId?.fullName || 'User'} ({report.reporterRole})
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    background: getStatusColor(report.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 4
                  }}>
                    {report.status}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* EXPANDED DETAILS */}
              {expandedReport?._id === report._id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                      Report Message
                    </div>
                    <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 13, color: '#1f2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {report.message}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {report.status !== 'in-progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(report._id, 'in-progress');
                        }}
                        disabled={updatingId === report._id}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: updatingId === report._id ? '#d1d5db' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: updatingId === report._id ? 'not-allowed' : 'pointer',
                          fontSize: 12
                        }}
                      >
                        {updatingId === report._id ? 'Updating...' : 'Review'}
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(report._id, 'resolved');
                        }}
                        disabled={updatingId === report._id}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: updatingId === report._id ? '#d1d5db' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: updatingId === report._id ? 'not-allowed' : 'pointer',
                          fontSize: 12
                        }}
                      >
                        {updatingId === report._id ? 'Updating...' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReports;
