import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import '../farmer/DisasterLog.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const _resolveWeatherSummary = (rec) => {
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

const DisasterInsights = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/disasters/public`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load public disasters', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const exportLogsAsCSV = () => {
    if (!logs || !logs.length) return alert('No records to export');
      const rows = logs.map(l => ({
        id: l.id || l._id,
        disasterType: l.disasterType || '',
        severity: l.severity ?? '',
        disasterDate: l.disasterDate || '',
        areaAffectedInHectares: l.areaAffectedInHectares ?? '',
        rainfall: l.rainfall ?? l.weatherData?.rainfall ?? '',
        temperature: l.temperature ?? l.weatherData?.temperature ?? '',
        humidity: l.humidity ?? l.weatherData?.humidity ?? '',
        estimatedCropLoss: l.estimatedCropLoss ?? '',
        estimatedFinancialLoss: l.estimatedFinancialLoss ?? '',
        createdAt: l.createdAt || ''
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
    a.download = `disaster_insights_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dlm-container">
      <div className="dlm-header">
        <div className="dlm-header-content">
          <h1>Disaster Insights</h1>
          <p>Aggregated, privacy-preserving disaster records.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="dlm-btn-secondary" onClick={exportLogsAsCSV}>Export CSV</button>
          <button className="dlm-btn-primary" onClick={fetchLogs}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="dlm-loading">Loading disaster records...</div>
      ) : logs.length === 0 ? (
        <div className="dlm-empty">
          <AlertTriangle size={48} />
          <h3>No disaster records available</h3>
          <p>There are no public disaster records to display.</p>
        </div>
      ) : (
        <div className="dlm-table-responsive">
          <table className="dlm-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Date</th>
                <th>Area (ha)</th>
                <th>Rainfall (mm)</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Crop Loss %</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id || log._id}>
                  <td><strong>{log.disasterType}</strong></td>
                  <td><span className={`dlm-severity-badge sev-${log.severity || 5}`}>{log.severity ?? '—'}</span></td>
                  <td>{log.disasterDate ? new Date(log.disasterDate).toLocaleDateString() : '—'}</td>
                  <td>{log.areaAffectedInHectares ?? '—'}</td>
                  <td>{(log.rainfall ?? log.weatherData?.rainfall) ?? '—'}</td>
                  <td>{(log.temperature ?? log.weatherData?.temperature) ?? '—'}</td>
                  <td>{(log.humidity ?? log.weatherData?.humidity) ?? '—'}</td>
                  <td>{log.estimatedCropLoss ?? '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DisasterInsights;
