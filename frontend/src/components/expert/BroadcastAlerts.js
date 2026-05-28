import React, { useState, useEffect } from "react";
import axios from "axios";
import { Send, AlertTriangle, Cloud, TrendingUp, Zap, X } from "lucide-react";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";
import "./BroadcastAlerts.css";

const BroadcastAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const [formData, setFormData] = useState({
    alertType: "Outbreak",
    title: "",
    content: "",
    region: "",
    affectedAreas: "",
    severity: "Medium"
  });

  const alertTypes = {
    Outbreak: {
      icon: AlertTriangle,
      spec: "Technical Bio-Security Bulletin",
      goal: "Stop a disease from spreading.",
      color: "#dc2626"
    },
    Weather: {
      icon: Cloud,
      spec: "Agronomic Risk Analysis",
      goal: "Prevent crop loss from frost/flood.",
      color: "#3b82f6"
    },
    Market: {
      icon: TrendingUp,
      spec: "Economic Intelligence Report",
      goal: "Help the farmer make more money.",
      color: "#059669"
    },
    Task: {
      icon: Zap,
      spec: "Regional Management Protocol",
      goal: "Get everyone to spray/fertilize at once.",
      color: "#f59e0b"
    }
  };

  useEffect(() => {
    if (userRole === "expert") {
      fetchMyAlerts();
    }
  }, [userRole]);

  const fetchMyAlerts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/alerts/my/alerts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data);
    } catch (err) {
      console.error("Fetch alerts error:", err);
      addToast("Failed to load alerts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        addToast("Title and content are required", "error");
        setCreating(false);
        return;
      }

      const payload = {
        alertType: formData.alertType,
        title: formData.title,
        content: formData.content,
        region: formData.region || "All Regions",
        affectedAreas: formData.affectedAreas
          ? formData.affectedAreas.split(",").map(a => a.trim())
          : [],
        severity: formData.severity
      };

      await axios.post(
        "http://localhost:5000/api/alerts/create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addToast("Broadcast alert created successfully!", "success");
      setFormData({
        alertType: "Outbreak",
        title: "",
        content: "",
        region: "",
        affectedAreas: "",
        severity: "Medium"
      });
      setShowForm(false);
      fetchMyAlerts();
    } catch (err) {
      console.error("Create alert error:", err);
      addToast(
        err?.response?.data?.error || "Failed to create alert",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm("Delete this alert?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast("Alert deleted", "success");
      fetchMyAlerts();
    } catch (err) {
      addToast("Failed to delete alert", "error");
    }
  };

  if (userRole !== "expert") {
    return null;
  }

  const selectedType = alertTypes[formData.alertType];
  const IconComponent = selectedType.icon;

  return (
    <div className="broadcast-alerts-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="alerts-header">
        <h2>Broadcast Alerts</h2>
        <button
          className="btn-create-alert"
          onClick={() => setShowForm(!showForm)}
        >
          <Send size={18} /> Create Alert
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="alert-form-card">
          <h3>Create Broadcast Alert</h3>
          <form onSubmit={handleCreateAlert}>
            <div className="form-group">
              <label>Alert Type *</label>
              <select
                name="alertType"
                value={formData.alertType}
                onChange={handleInputChange}
              >
                {Object.keys(alertTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="alert-spec-info">
                <strong>AI Specification:</strong> {alertTypes[formData.alertType].spec}
                <br />
                <strong>Goal:</strong> {alertTypes[formData.alertType].goal}
              </div>
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Potato Blight Warning - Northern Region"
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label>Alert Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Provide detailed alert information, recommendations, and action items..."
                rows="6"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Region</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="e.g., Northern Region, East District"
                />
              </div>

              <div className="form-group">
                <label>Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Affected Areas (comma-separated)</label>
              <input
                type="text"
                name="affectedAreas"
                value={formData.affectedAreas}
                onChange={handleInputChange}
                placeholder="e.g., North Valley, East Plains, Central Hills"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={creating}>
                {creating ? "Creating..." : "Create Alert"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="alerts-list">
        {loading ? (
          <div className="loading">Loading your alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <p>No alerts created yet. Create one to broadcast important information to farmers!</p>
          </div>
        ) : (
          alerts.map(alert => {
            const type = alertTypes[alert.alertType];
            const Icon = type.icon;
            return (
              <div key={alert._id} className="alert-item">
                <div className="alert-header-item" style={{ borderLeftColor: type.color }}>
                  <div className="alert-icon" style={{ color: type.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="alert-meta">
                    <h4>{alert.title}</h4>
                    <p className="alert-type">
                      {alert.alertType} • Severity: <span className={`severity-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    </p>
                    <p className="alert-region">{alert.region}</p>
                  </div>
                  <div className="alert-stats">
                    <span className="view-count">{alert.views} views</span>
                  </div>
                </div>
                <div className="alert-content-preview">
                  <p>{alert.content.substring(0, 150)}...</p>
                </div>
                <div className="alert-footer">
                  <small>
                    Created: {new Date(alert.createdAt).toLocaleDateString()}
                  </small>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDeleteAlert(alert._id)}
                    title="Delete alert"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BroadcastAlerts;
