import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AlertTriangle, Cloud, TrendingUp, Zap, Eye, Filter } from "lucide-react";
import "./AlertsViewer.css";

const AlertsViewer = () => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showExpired, setShowExpired] = useState(false);
  const [filters, setFilters] = useState({
    alertType: "",
    severity: ""
  });

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const enabled = ["farmer", "admin", "user"].includes(userRole);
  const queryClient = useQueryClient();

  const fetchAlerts = async () => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const url = `http://localhost:5000/api/alerts?includeExpired=${showExpired}`;
    const res = await axios.get(url, config);
    return res.data || [];
  };

  const {
    data: alerts = [],
    isLoading,
    isFetching,
    error
  } = useQuery({
    queryKey: ["alerts", showExpired, token],
    queryFn: fetchAlerts,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false
  });

  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    if (filters.alertType) {
      filtered = filtered.filter(a => a.alertType === filters.alertType);
    }

    if (filters.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    return filtered;
  }, [alerts, filters]);

  const alertTypes = {
    Outbreak: {
      icon: AlertTriangle,
      color: "#dc2626",
      bgColor: "#fee2e2"
    },
    Weather: {
      icon: Cloud,
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    Market: {
      icon: TrendingUp,
      color: "#059669",
      bgColor: "#f0fdf4"
    },
    Task: {
      icon: Zap,
      color: "#f59e0b",
      bgColor: "#fffbeb"
    }
  };

  const handleViewAlert = async (alert) => {
    try {
      // Increment view count on the backend
      try {
        console.log("Incrementing views for alert:", alert._id);
        const incrementRes = await axios.put(
          `http://localhost:5000/api/alerts/${alert._id}/views`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("View increment response:", incrementRes.data);
        
        // Update the alert with the new view count in cache
        const updatedAlert = incrementRes.data;
        queryClient.setQueryData(["alerts", showExpired, token], (oldAlerts = []) =>
          oldAlerts.map(a => a._id === alert._id ? updatedAlert : a)
        );
        
        // Show the alert details with updated view count
        setSelectedAlert(updatedAlert);
        toast.success('Alert viewed');
        return;
      } catch (incrementErr) {
        console.error("Increment views error:", incrementErr.response?.data || incrementErr.message);
        
        // Temporary fallback: increment locally while backend endpoint is being set up
        const updatedAlert = { ...alert, views: (alert.views || 0) + 1 };
        queryClient.setQueryData(["alerts", showExpired, token], (oldAlerts = []) =>
          oldAlerts.map(a => a._id === alert._id ? updatedAlert : a)
        );
        setSelectedAlert(updatedAlert);
        console.warn("Using local increment - backend endpoint may not be ready");
        return;
      }
    } catch (err) {
      console.error("Fetch alert error:", err);
      toast.error('Failed to load alert. Please try again.');
      setSelectedAlert(alert);
    }
  };

  if (userRole !== "farmer" && userRole !== "admin" && userRole !== "user") {
    return null;
  }

  return (
    <div className="alerts-viewer-container">
      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="alert-detail-modal" onClick={() => setSelectedAlert(null)}>
          <div className="modal-overlay" />
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedAlert(null)}
            >
              ✕
            </button>

            {(() => {
              const typeInfo = alertTypes[selectedAlert.alertType] || {
                icon: AlertTriangle,
                color: '#6b7280',
                bgColor: '#f3f4f6'
              };
              const Icon = typeInfo.icon;
              return (
                <>
                  <div className="modal-header" style={{ background: typeInfo.bgColor, borderLeftColor: typeInfo.color }}>
                    <div className="modal-icon" style={{ color: typeInfo.color }}>
                      <Icon size={32} />
                    </div>
                    <div className="modal-title-section">
                      <h2>{selectedAlert.title || 'Alert'}</h2>
                      <div className="modal-meta">
                        <span className="type-badge">{selectedAlert.alertType || 'Alert'}</span>
                        <span className={`severity-badge severity-${(selectedAlert.severity || 'medium').toLowerCase()}`}>
                          {selectedAlert.severity || 'Medium'}
                        </span>
                        <span className="views-badge">
                          <Eye size={14} /> {selectedAlert.views || 0} views
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-body">
                    <div className="detail-section">
                      <h3>Alert Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Alert Type:</label>
                          <span>{selectedAlert.alertType || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <label>Region:</label>
                          <span>{selectedAlert.region || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <label>Severity:</label>
                          <span className={`severity-${(selectedAlert.severity || 'medium').toLowerCase()}`}>
                            {selectedAlert.severity || 'Medium'}
                          </span>
                        </div>
                        <div className="info-item">
                          <label>Created By:</label>
                          <span>{selectedAlert.expertName || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedAlert.aiSpecification && (
                      <div className="detail-section">
                        <h3>AI Specification</h3>
                        <p className="spec-text">{selectedAlert.aiSpecification}</p>
                      </div>
                    )}

                    {selectedAlert.goal && (
                      <div className="detail-section">
                        <h3>Goal</h3>
                        <p className="goal-text">{selectedAlert.goal}</p>
                      </div>
                    )}

                    {selectedAlert.content && (
                      <div className="detail-section">
                        <h3>Details</h3>
                        <p className="content-text">{selectedAlert.content}</p>
                      </div>
                    )}

                    {selectedAlert.affectedAreas && selectedAlert.affectedAreas.length > 0 && (
                      <div className="detail-section">
                        <h3>Affected Areas</h3>
                        <div className="areas-list">
                          {selectedAlert.affectedAreas.map((area, idx) => (
                            <span key={idx} className="area-tag">{area}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="detail-footer">
                      <small>
                        Published: {selectedAlert.createdAt ? new Date(selectedAlert.createdAt).toLocaleString() : 'N/A'}
                      </small>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Alerts View */}
      <div className="alerts-viewer-header">
        <h2>Broadcast Alerts</h2>
        <div className="filter-controls">
          <Filter size={18} />
          <select
            value={filters.alertType}
            onChange={(e) => setFilters(prev => ({ ...prev, alertType: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Alert Types</option>
            <option value="Outbreak">Outbreak</option>
            <option value="Weather">Weather</option>
            <option value="Market">Market</option>
            <option value="Task">Task</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Severity Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <label className="expired-toggle">
            <input 
              type="checkbox" 
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
            />
            <span>Show Expired Alerts</span>
          </label>
        </div>
      </div>

      <div className="alerts-grid">
        {isLoading || isFetching ? (
          <div className="loading">Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <p>No broadcast alerts at this time. Check back soon!</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const typeInfo = alertTypes[alert.alertType] || {
              icon: AlertTriangle,
              color: '#6b7280',
              bgColor: '#f3f4f6'
            };
            const Icon = typeInfo.icon;
            return (
              <div
                key={alert._id}
                className="alert-card"
                onClick={() => handleViewAlert(alert)}
                style={{ borderLeftColor: typeInfo.color }}
              >
                <div className="card-icon" style={{ background: typeInfo.bgColor, color: typeInfo.color }}>
                  <Icon size={28} />
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <h3>{alert.title || 'Alert'}</h3>
                    <div className="header-tags">
                      <span
                        className={`severity-tag severity-${(alert.severity || 'medium').toLowerCase()}`}
                      >
                        {alert.severity || 'Medium'}
                      </span>
                      {alert.expiresAt && new Date(alert.expiresAt) < new Date() && (
                        <span className="expired-badge">Expired</span>
                      )}
                    </div>
                  </div>

                  <p className="card-region">{alert.region}</p>

                  <p className="card-preview">{alert.content.substring(0, 80)}...</p>

                  <div className="card-footer">
                    <span className="alert-type">{alert.alertType}</span>
                    <span className="view-indicator" title="Click to view details">
                      <Eye size={14} /> {(alert.views || 0)} views
                    </span>
                  </div>
                </div>

                <button className="card-view-btn">View Details →</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsViewer;
