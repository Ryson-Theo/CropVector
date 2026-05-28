import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import './DisasterLog.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const DisasterLogManagement = ({ readOnly = false }) => {
  const [fields, setFields] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailsRecord, setDetailsRecord] = useState(null);
  
  const [form, setForm] = useState({
    fieldId: '',
    disasterType: 'Flood',
    severity: 5,
    disasterDate: new Date().toISOString().substring(0, 10),
    areaAffectedInHectares: '',
    estimatedCropLoss: '',
    estimatedFinancialLoss: '',
    recoveryNotes: '',
    recoveryMethods: '',
    recoveryStartDate: '',
    recoveryEndDate: '',
    recoverySuccess: '',
    rainfall: '',
    temperature: '',
    humidity: '',
    windSpeed: '',
    photos: ''
  });

  const [editForm, setEditForm] = useState({
    fieldId: '',
    disasterType: '',
    severity: 5,
    areaAffectedInHectares: '',
    estimatedCropLoss: '',
    estimatedFinancialLoss: '',
    recoveryNotes: '',
    recoveryMethods: '',
    recoveryStartDate: '',
    recoveryEndDate: '',
    recoverySuccess: '',
    rainfall: '',
    temperature: '',
    humidity: '',
    windSpeed: '',
    photos: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const fetchFields = async () => {
    setLoadingFields(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/fields`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setFields(res.data || []);
      setForm(prev => ({ ...prev, fieldId: (res.data && res.data[0]?._id) || prev.fieldId }));
    } catch (err) {
      console.error('Failed to fetch fields', err);
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token');
      const url = readOnly ? `${API_BASE}/disasters/public` : `${API_BASE}/disasters/mine`;
      const res = await axios.get(url, {
        headers: token && !readOnly ? { Authorization: `Bearer ${token}` } : {}
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchFields();
    fetchLogs();
  }, [readOnly]);

  // Ensure fields are fetched when the create form or edit modal opens
  useEffect(() => {
    if (showForm && fields.length === 0) fetchFields();
  }, [showForm]);

  useEffect(() => {
    if (editingId && fields.length === 0) fetchFields();
  }, [editingId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fieldId: form.fieldId,
      disasterType: form.disasterType,
      severity: Number(form.severity) || undefined,
      disasterDate: form.disasterDate,
      areaAffectedInHectares: form.areaAffectedInHectares ? Number(form.areaAffectedInHectares) : undefined,
      estimatedCropLoss: form.estimatedCropLoss ? Number(form.estimatedCropLoss) : undefined,
      estimatedFinancialLoss: form.estimatedFinancialLoss ? Number(form.estimatedFinancialLoss) : undefined,
      recoveryNotes: form.recoveryNotes || undefined,
      recoveryMethods: form.recoveryMethods ? form.recoveryMethods.split(',').map(s => s.trim()) : undefined,
      recoveryStartDate: form.recoveryStartDate || undefined,
      recoveryEndDate: form.recoveryEndDate || undefined,
      recoverySuccess: form.recoverySuccess || undefined,
      weatherData: {
        rainfall: form.rainfall ? Number(form.rainfall) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        humidity: form.humidity ? Number(form.humidity) : undefined,
        windSpeed: form.windSpeed ? Number(form.windSpeed) : undefined,
      },
      photosUrl: form.photos ? form.photos.split(',').map(s => s.trim()) : undefined,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/disasters`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Disaster logged successfully');
      setForm({
        fieldId: fields[0]?._id || '',
        disasterType: 'Flood',
        severity: 5,
        disasterDate: new Date().toISOString().substring(0, 10),
        areaAffectedInHectares: '',
        estimatedCropLoss: '',
        estimatedFinancialLoss: '',
        recoveryNotes: '',
        recoveryMethods: '',
        recoveryStartDate: '',
        recoveryEndDate: '',
        recoverySuccess: '',
        rainfall: '',
        temperature: '',
        humidity: '',
        windSpeed: '',
        photos: ''
      });
      setShowForm(false);
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to log disaster');
    }
  };

  const handleEdit = (log) => {
    setEditingId(log._id);
    setEditForm({
      fieldId: log.fieldId || '',
      disasterType: log.disasterType || '',
      severity: log.severity || 5,
      areaAffectedInHectares: log.areaAffectedInHectares || '',
      estimatedCropLoss: log.estimatedCropLoss || '',
      estimatedFinancialLoss: log.estimatedFinancialLoss || '',
      recoveryNotes: log.recoveryNotes || '',
      recoveryMethods: (log.recoveryMethods && Array.isArray(log.recoveryMethods)) ? log.recoveryMethods.join(', ') : (log.recoveryMethods || ''),
      recoverySuccess: log.recoverySuccess || '',
      rainfall: log.weatherData?.rainfall ?? '',
      temperature: log.weatherData?.temperature ?? '',
      humidity: log.weatherData?.humidity ?? '',
      windSpeed: log.weatherData?.windSpeed ?? '',
      photos: (log.photosUrl && Array.isArray(log.photosUrl)) ? log.photosUrl.join(', ') : (log.photosUrl || ''),
    });
  };

  const handleView = (log) => {
    setDetailsRecord(log);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        fieldId: editForm.fieldId,
        disasterType: editForm.disasterType,
        severity: editForm.severity !== undefined ? Number(editForm.severity) : undefined,
        areaAffectedInHectares: editForm.areaAffectedInHectares ? Number(editForm.areaAffectedInHectares) : undefined,
        estimatedCropLoss: editForm.estimatedCropLoss ? Number(editForm.estimatedCropLoss) : undefined,
        estimatedFinancialLoss: editForm.estimatedFinancialLoss ? Number(editForm.estimatedFinancialLoss) : undefined,
        recoveryNotes: editForm.recoveryNotes || undefined,
        recoveryMethods: editForm.recoveryMethods ? editForm.recoveryMethods.split(',').map(s => s.trim()).filter(Boolean) : [],
        recoveryStartDate: editForm.recoveryStartDate || undefined,
        recoveryEndDate: editForm.recoveryEndDate || undefined,
        recoverySuccess: editForm.recoverySuccess || undefined,
        weatherData: {
          rainfall: editForm.rainfall !== '' && editForm.rainfall !== undefined ? Number(editForm.rainfall) : undefined,
          temperature: editForm.temperature !== '' && editForm.temperature !== undefined ? Number(editForm.temperature) : undefined,
          humidity: editForm.humidity !== '' && editForm.humidity !== undefined ? Number(editForm.humidity) : undefined,
          windSpeed: editForm.windSpeed !== '' && editForm.windSpeed !== undefined ? Number(editForm.windSpeed) : undefined,
        },
        photosUrl: editForm.photos ? editForm.photos.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      await axios.patch(`${API_BASE}/disasters/${editingId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingId(null);
      toast.success('Disaster updated successfully');
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to update disaster');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this disaster log? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/disasters/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Disaster deleted successfully');
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to delete disaster');
    }
  };

  const exportLogsAsCSV = () => {
    if (!logs || !logs.length) return toast.info('No records to export');
    const rows = logs.map(l => ({
      id: l._id,
      fieldId: l.fieldId || '',
      fieldName: resolveFieldName(l.fieldId) || '',
      disasterType: l.disasterType || '',
      severity: l.severity ?? '',
      disasterDate: l.disasterDate || '',
      areaAffectedInHectares: l.areaAffectedInHectares ?? '',
      estimatedCropLoss: l.estimatedCropLoss ?? '',
      estimatedFinancialLoss: l.estimatedFinancialLoss ?? '',
      recoverySuccess: l.recoverySuccess || '',
      recoveryMethods: (l.recoveryMethods && Array.isArray(l.recoveryMethods)) ? l.recoveryMethods.join('; ') : (l.recoveryMethods || ''),
      recoveryStartDate: l.recoveryStartDate || '',
      recoveryEndDate: l.recoveryEndDate || '',
      recoveryNotes: l.recoveryNotes || '',
      rainfall: l.weatherData?.rainfall ?? '',
      temperature: l.weatherData?.temperature ?? '',
      humidity: l.weatherData?.humidity ?? '',
      windSpeed: l.weatherData?.windSpeed ?? '',
      photos: (l.photosUrl && Array.isArray(l.photosUrl)) ? l.photosUrl.join('; ') : (l.photosUrl || ''),
    }));

    const header = Object.keys(rows[0]);
    const csv = [header.join(',')].concat(
      rows.map(r => header.map(h => {
        const v = r[h] === null || r[h] === undefined ? '' : String(r[h]);
        return `"${v.replace(/"/g, '""')}"`;
      }).join(','))
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disaster_logs_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const resolveFieldName = (fieldRef) => {
    if (!fieldRef) return '';
    if (typeof fieldRef === 'string') {
      const f = fields.find(x => x._id === fieldRef);
      return f?.fieldName || fieldRef;
    }
    if (typeof fieldRef === 'object') {
      if (fieldRef.fieldName) return fieldRef.fieldName;
      if (fieldRef._id) {
        const f = fields.find(x => x._id === fieldRef._id);
        return f?.fieldName || fieldRef._id;
      }
    }
    return String(fieldRef);
  };

  const resolveRecoveryStatus = (rec) => {
    if (!rec) return '—';
    if (typeof rec === 'string') return rec || '—';
    return rec.recoverySuccess || rec.recovery_status || rec.status || '—';
  };

  const resolveRecoveryMethods = (rec) => {
    if (!rec) return '—';
    if (Array.isArray(rec.recoveryMethods)) return rec.recoveryMethods.join(', ') || '—';
    if (typeof rec.recoveryMethods === 'string') return rec.recoveryMethods || '—';
    if (typeof rec.recovery_methods === 'string') return rec.recovery_methods || '—';
    if (Array.isArray(rec.recovery_methods)) return rec.recovery_methods.join(', ') || '—';
    return '—';
  };

  const resolveWeatherSummary = (rec) => {
    if (!rec) return '—';
    const rainfall = rec.weatherData?.rainfall ?? rec.rainfall ?? rec.rain ?? null;
    const temp = rec.weatherData?.temperature ?? rec.temperature ?? null;
    const humidity = rec.weatherData?.humidity ?? rec.humidity ?? null;
    if (rainfall === null && temp === null && humidity === null) return '—';
    const parts = [];
    if (rainfall !== null) parts.push(`${rainfall}mm`);
    if (temp !== null) parts.push(`${temp}°C`);
    if (humidity !== null) parts.push(`${humidity}%`);
    return parts.join(' • ');
  };

  const highSeverityCount = logs.filter(l => l.severity >= 7).length;
  const _totalLoss = logs.reduce((sum, l) => sum + (l.estimatedFinancialLoss || 0), 0);

  return (
    <div className="dlm-container">
      {/* Header */}
      <div className="dlm-header">
        <div className="dlm-header-content">
            <h1>{readOnly ? 'Disaster Insights' : 'Disaster Log Management'}</h1>
            <p>{readOnly ? 'View aggregated, privacy-preserving disaster records for analysis and export.' : 'Track and manage disaster records on your fields'}</p>
          </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {readOnly ? (
            <button className="dlm-btn-secondary" onClick={exportLogsAsCSV} title="Export records as CSV for study">
              Export CSV
            </button>
          ) : (
            <button 
              className="dlm-btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={18} />
              Log New Disaster
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {logs.length > 0 && (
        <div className="dlm-stats-grid">
          <div className="dlm-stat-card">
            <div className="dlm-stat-icon">
              <AlertTriangle size={32} />
            </div>
            <div className="dlm-stat-info">
              <p className="dlm-stat-label">Total Records</p>
              <p className="dlm-stat-value">{logs.length}</p>
            </div>
          </div>

          <div className="dlm-stat-card">
            <div className="dlm-stat-icon" style={{ color: '#ef4444' }}>
              <AlertTriangle size={32} />
            </div>
            <div className="dlm-stat-info">
              <p className="dlm-stat-label">High Severity</p>
              <p className="dlm-stat-value">{highSeverityCount}</p>
            </div>
          </div>

          {/* Total financial-loss stat removed per UI request */}
        </div>
      )}

      {/* Details Modal */}
      {detailsRecord && (
        <div className="dlm-modal-overlay">
          <div className="dlm-modal">
            <div className="dlm-modal-header">
              <h2>Disaster Details</h2>
              <button
                className="dlm-modal-close"
                onClick={() => setDetailsRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dlm-modal-body">
              <div className="dlm-details-grid">
                <div>
                  <p className="dlm-detail-label">Field</p>
                  <p className="dlm-detail-value">{resolveFieldName(detailsRecord.fieldId) || detailsRecord.fieldId}</p>
                </div>

                <div>
                  <p className="dlm-detail-label">Type</p>
                  <p className="dlm-detail-value">{detailsRecord.disasterType}</p>
                </div>

                <div>
                  <p className="dlm-detail-label">Severity</p>
                  <p className="dlm-detail-value">{detailsRecord.severity}</p>
                </div>

                <div>
                  <p className="dlm-detail-label">Date</p>
                  <p className="dlm-detail-value">{new Date(detailsRecord.disasterDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <p className="dlm-detail-label">Recovery Status</p>
                <p className="dlm-detail-value">{resolveRecoveryStatus(detailsRecord)}</p>
                <p className="dlm-detail-label">Recovery Methods</p>
                <p className="dlm-detail-value">{resolveRecoveryMethods(detailsRecord)}</p>
              </div>

              <div style={{ marginTop: 12 }}>
                <p className="dlm-detail-label">Weather</p>
                <p className="dlm-detail-value">{resolveWeatherSummary(detailsRecord) !== '—' ? `Rainfall/Temp/Humidity: ${resolveWeatherSummary(detailsRecord)}` : '—'}</p>
              </div>

              <div style={{ marginTop: 12 }}>
                <p className="dlm-detail-label">Recovery Notes</p>
                <p className="dlm-detail-description">{detailsRecord.recoveryNotes || '—'}</p>
              </div>

              <div style={{ marginTop: 12 }}>
                <p className="dlm-detail-label">Photos</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detailsRecord.photosUrl && detailsRecord.photosUrl.length ? (
                    detailsRecord.photosUrl.map((p, idx) => (
                      <img key={idx} src={p} alt={`photo-${idx}`} className="dlm-photo-thumb" />
                    ))
                  ) : (
                    <p className="dlm-detail-value">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="dlm-form-container">
          <div className="dlm-form-header">
            <h3>Log New Disaster</h3>
            <button 
              className="dlm-form-close"
              onClick={() => setShowForm(false)}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="dlm-form">
            {loadingFields ? (
              <p>Loading fields...</p>
            ) : (
              <>
                <div className="dlm-form-group">
                  <label htmlFor="fieldId">Field</label>
                  <select 
                    id="fieldId"
                    name="fieldId" 
                    value={form.fieldId} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Select a field</option>
                    {fields.map(f => (
                      <option key={f._id} value={f._id}>
                        {f.fieldName} - {f.areaInHectares} ha
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dlm-form-row">
                  <div className="dlm-form-group">
                    <label htmlFor="disasterType">Disaster Type</label>
                    <select 
                      id="disasterType"
                      name="disasterType" 
                      value={form.disasterType} 
                      onChange={handleChange}
                    >
                      <option>Flood</option>
                      <option>Frost</option>
                      <option>Hail</option>
                      <option>Drought</option>
                      <option>Storm</option>
                      <option>Disease</option>
                      <option>Pest Attack</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="severity">Severity (1-10)</label>
                    <input 
                      id="severity"
                      type="number" 
                      name="severity" 
                      min="1" 
                      max="10" 
                      value={form.severity} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="disasterDate">Date</label>
                    <input 
                      id="disasterDate"
                      type="date" 
                      name="disasterDate" 
                      value={form.disasterDate} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="dlm-form-row">
                  <div className="dlm-form-group">
                    <label htmlFor="areaAffectedInHectares">Area Affected (ha)</label>
                    <input 
                      id="areaAffectedInHectares"
                      type="number" 
                      name="areaAffectedInHectares" 
                      value={form.areaAffectedInHectares} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="estimatedCropLoss">Crop Loss (%)</label>
                    <input 
                      id="estimatedCropLoss"
                      type="number" 
                      name="estimatedCropLoss" 
                      value={form.estimatedCropLoss} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="estimatedFinancialLoss">Financial Loss (₹)</label>
                    <input 
                      id="estimatedFinancialLoss"
                      type="number" 
                      name="estimatedFinancialLoss" 
                      value={form.estimatedFinancialLoss} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="dlm-form-group">
                  <label htmlFor="recoveryNotes">Recovery Notes</label>
                  <textarea 
                    id="recoveryNotes"
                    name="recoveryNotes" 
                    value={form.recoveryNotes} 
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                <div className="dlm-form-row">
                  <div className="dlm-form-group">
                    <label htmlFor="recoveryMethods">Recovery Methods (comma separated)</label>
                    <input 
                      id="recoveryMethods"
                      name="recoveryMethods" 
                      value={form.recoveryMethods} 
                      onChange={handleChange}
                      placeholder="e.g., Replanting, Irrigation, Pest control"
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="recoverySuccess">Recovery Status</label>
                    <select 
                      id="recoverySuccess"
                      name="recoverySuccess" 
                      value={form.recoverySuccess} 
                      onChange={handleChange}
                    >
                      <option value="">--</option>
                      <option>Full</option>
                      <option>Partial</option>
                      <option>Failed</option>
                    </select>
                  </div>
                </div>

                <div className="dlm-form-row">
                  <div className="dlm-form-group">
                    <label htmlFor="recoveryStartDate">Recovery Start</label>
                    <input 
                      id="recoveryStartDate"
                      type="date" 
                      name="recoveryStartDate" 
                      value={form.recoveryStartDate} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="recoveryEndDate">Recovery End</label>
                    <input 
                      id="recoveryEndDate"
                      type="date" 
                      name="recoveryEndDate" 
                      value={form.recoveryEndDate} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <fieldset className="dlm-form-section">
                  <legend>Weather Data</legend>
                  <div className="dlm-form-row">
                    <div className="dlm-form-group">
                      <label htmlFor="rainfall">Rainfall (mm)</label>
                      <input 
                        id="rainfall"
                        type="number" 
                        name="rainfall" 
                        value={form.rainfall} 
                        onChange={handleChange}
                      />
                    </div>

                    <div className="dlm-form-group">
                      <label htmlFor="temperature">Temperature (°C)</label>
                      <input 
                        id="temperature"
                        type="number" 
                        name="temperature" 
                        value={form.temperature} 
                        onChange={handleChange}
                      />
                    </div>

                    <div className="dlm-form-group">
                      <label htmlFor="humidity">Humidity (%)</label>
                      <input 
                        id="humidity"
                        type="number" 
                        name="humidity" 
                        value={form.humidity} 
                        onChange={handleChange}
                      />
                    </div>

                    <div className="dlm-form-group">
                      <label htmlFor="windSpeed">Wind Speed (m/s)</label>
                      <input 
                        id="windSpeed"
                        type="number" 
                        name="windSpeed" 
                        value={form.windSpeed} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="dlm-form-group">
                  <label htmlFor="photos">Photos (comma-separated URLs)</label>
                  <input 
                    id="photos"
                    name="photos" 
                    value={form.photos} 
                    onChange={handleChange}
                    placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  />
                </div>

                <div className="dlm-form-actions">
                  <button 
                    type="button" 
                    className="dlm-btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="dlm-btn-primary">
                    Save Disaster Log
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* History Section */}
      <div className="dlm-history-container">
        <h2>Disaster Records</h2>
        
        {loadingLogs ? (
          <div className="dlm-loading">Loading disaster records...</div>
        ) : logs.length === 0 ? (
          <div className="dlm-empty">
            <AlertTriangle size={48} />
            <h3>No disaster records yet</h3>
            <p>Log your first disaster to track impacts and recovery</p>
          </div>
        ) : (
          <div className="dlm-table-responsive">
            {readOnly ? (
              <table className="dlm-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Date</th>
                    <th>Area (ha)</th>
                    <th>Recovery Status</th>
                    <th>Weather</th>
                    <th>Crop Loss %</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id || log._id}>
                      <td><strong>{log.disasterType}</strong></td>
                      <td>
                        <span className={`dlm-severity-badge sev-${log.severity || 5}`}>
                          {log.severity ?? '—'}
                        </span>
                      </td>
                      <td>{log.disasterDate ? new Date(log.disasterDate).toLocaleDateString() : '—'}</td>
                      <td>{log.areaAffectedInHectares ?? '—'}</td>
                      <td>{resolveRecoveryStatus(log)}</td>
                      <td>{resolveWeatherSummary(log)}</td>
                      <td>{log.estimatedCropLoss ?? '—'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="dlm-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Field</th>
                    <th>Date</th>
                    <th>Area (ha)</th>
                    <th>Recovery Status</th>
                    <th>Weather</th>
                    <th>Photos</th>
                    <th>Crop Loss %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td><strong>{log.disasterType}</strong></td>
                      <td>
                        <span className={`dlm-severity-badge sev-${log.severity || 5}`}>
                          {log.severity || '—'}
                        </span>
                      </td>
                      <td>{fields.find(f => f._id === log.fieldId)?.fieldName || '—'}</td>
                      <td>{new Date(log.disasterDate).toLocaleDateString()}</td>
                      <td>{log.areaAffectedInHectares ?? '—'}</td>
                      <td>{resolveRecoveryStatus(log)}</td>
                      <td>{resolveWeatherSummary(log)}</td>
                      <td>{(log.photosUrl && log.photosUrl.length) ? log.photosUrl.length : '—'}</td>
                      <td>{log.estimatedCropLoss ?? '—'}%</td>
                      <td>
                        <div className="dlm-actions">
                          <>
                            <button
                              className="dlm-btn-icon dlm-btn-edit"
                              onClick={() => handleEdit(log)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="dlm-btn-icon dlm-btn-delete"
                              onClick={() => handleDelete(log._id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                          <button
                            className="dlm-btn-icon"
                            onClick={() => handleView(log)}
                            title="View details"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="dlm-modal-overlay">
          <div className="dlm-modal">
            <div className="dlm-modal-header">
              <h2>Edit Disaster Record</h2>
              <button
                className="dlm-modal-close"
                onClick={() => setEditingId(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dlm-modal-body">
              <div className="dlm-form-group">
                <label htmlFor="edit-field">Field</label>
                <select
                  id="edit-field"
                  name="fieldId"
                  value={editForm.fieldId || ''}
                  onChange={handleEditChange}
                >
                  <option value="">Select field</option>
                  {fields.map(f => (
                    <option key={f._id} value={f._id}>{f.fieldName} - {f.areaInHectares} ha</option>
                  ))}
                </select>
              </div>
              <div className="dlm-form-group">
                <label htmlFor="edit-type">Disaster Type</label>
                <select
                  id="edit-type"
                  name="disasterType"
                  value={editForm.disasterType || ''}
                  onChange={handleEditChange}
                >
                  <option value="">Select Type</option>
                  <option>Flood</option>
                  <option>Frost</option>
                  <option>Hail</option>
                  <option>Drought</option>
                  <option>Storm</option>
                  <option>Disease</option>
                  <option>Pest Attack</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="dlm-form-row">
                <div className="dlm-form-group">
                  <label htmlFor="edit-severity">Severity (1-10)</label>
                  <input
                    id="edit-severity"
                    type="number"
                    name="severity"
                    min="1"
                    max="10"
                    value={editForm.severity || 5}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="dlm-form-group">
                  <label htmlFor="edit-area">Area Affected (ha)</label>
                  <input
                    id="edit-area"
                    type="number"
                    name="areaAffectedInHectares"
                    value={editForm.areaAffectedInHectares || ''}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="dlm-form-row">
                <div className="dlm-form-group">
                  <label htmlFor="edit-crop">Crop Loss (%)</label>
                  <input
                    id="edit-crop"
                    type="number"
                    name="estimatedCropLoss"
                    value={editForm.estimatedCropLoss || ''}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="dlm-form-group">
                  <label htmlFor="edit-financial">Financial Loss (₹)</label>
                  <input
                    id="edit-financial"
                    type="number"
                    name="estimatedFinancialLoss"
                    value={editForm.estimatedFinancialLoss || ''}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="dlm-form-group">
                <label htmlFor="edit-notes">Recovery Notes</label>
                <textarea
                  id="edit-notes"
                  name="recoveryNotes"
                  value={editForm.recoveryNotes || ''}
                  onChange={handleEditChange}
                  rows="3"
                />
              </div>
              <div className="dlm-form-row">
                <div className="dlm-form-group">
                  <label htmlFor="edit-recoveryMethods">Recovery Methods (comma separated)</label>
                  <input
                    id="edit-recoveryMethods"
                    name="recoveryMethods"
                    value={editForm.recoveryMethods || ''}
                    onChange={handleEditChange}
                    placeholder="e.g., Replanting, Irrigation"
                  />
                </div>

                <div className="dlm-form-group">
                  <label htmlFor="edit-recoverySuccess">Recovery Status</label>
                  <select
                    id="edit-recoverySuccess"
                    name="recoverySuccess"
                    value={editForm.recoverySuccess || ''}
                    onChange={handleEditChange}
                  >
                    <option value="">--</option>
                    <option>Full</option>
                    <option>Partial</option>
                    <option>Failed</option>
                  </select>
                </div>
              </div>

              <div className="dlm-form-row">
                <div className="dlm-form-group">
                  <label htmlFor="edit-recoveryStartDate">Recovery Start</label>
                  <input
                    id="edit-recoveryStartDate"
                    type="date"
                    name="recoveryStartDate"
                    value={editForm.recoveryStartDate || ''}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="dlm-form-group">
                  <label htmlFor="edit-recoveryEndDate">Recovery End</label>
                  <input
                    id="edit-recoveryEndDate"
                    type="date"
                    name="recoveryEndDate"
                    value={editForm.recoveryEndDate || ''}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <fieldset className="dlm-form-section">
                <legend>Weather Data</legend>
                <div className="dlm-form-row">
                  <div className="dlm-form-group">
                    <label htmlFor="edit-rainfall">Rainfall (mm)</label>
                    <input
                      id="edit-rainfall"
                      type="number"
                      name="rainfall"
                      value={editForm.rainfall || ''}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="edit-temperature">Temperature (°C)</label>
                    <input
                      id="edit-temperature"
                      type="number"
                      name="temperature"
                      value={editForm.temperature || ''}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="edit-humidity">Humidity (%)</label>
                    <input
                      id="edit-humidity"
                      type="number"
                      name="humidity"
                      value={editForm.humidity || ''}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="dlm-form-group">
                    <label htmlFor="edit-windSpeed">Wind Speed (m/s)</label>
                    <input
                      id="edit-windSpeed"
                      type="number"
                      name="windSpeed"
                      value={editForm.windSpeed || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="dlm-form-group">
                <label htmlFor="edit-photos">Photos (comma-separated URLs)</label>
                <input
                  id="edit-photos"
                  name="photos"
                  value={editForm.photos || ''}
                  onChange={handleEditChange}
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                />
              </div>
            </div>

            <div className="dlm-modal-footer">
              <button
                className="dlm-btn-secondary"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
              <button
                className="dlm-btn-primary"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterLogManagement;
