import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  MessageSquare, 
  Megaphone, 
  AlertTriangle, 
  Activity, 
  ArrowRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

/* ================= CSS INIT ================= */
const initCSS = () => {
  if (document.getElementById("expert-dashboard-css")) return;
  const s = document.createElement("style");
  s.id = "expert-dashboard-css";
  s.innerHTML = `
    .dash-container { padding: 2rem; background-color: #f8fafc; min-height: 100%; font-family: 'Inter', system-ui, sans-serif; color: #1e293b; }
    .dash-header { margin-bottom: 2rem; }
    .dash-title { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .dash-subtitle { color: #64748b; font-size: 0.95rem; }
    
    .section-title { font-size: 1.2rem; font-weight: 700; color: #334155; margin: 2.5rem 0 1.25rem; display: flex; align-items: center; gap: 0.75rem; }
    
    .grid-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
    .grid-modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .grid-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }

    .stat-card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.2s ease; display: flex; justify-content: space-between; align-items: center; }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); border-color: #cbd5e1; }
    .stat-icon { padding: 0.75rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
    .stat-label { font-size: 0.875rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1; margin-top: 0.5rem; }
    .stat-desc { font-size: 0.875rem; color: #94a3b8; margin-top: 0.5rem; }

    .module-card { background: white; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; height: 100%; transition: all 0.2s; cursor: pointer; position: relative; overflow: hidden; }
    .module-card:hover { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); transform: translateY(-2px); }
    .module-icon { width: 44px; height: 44px; border-radius: 10px; background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .module-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
    .module-desc { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; flex-grow: 1; line-height: 1.5; }
    .module-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-top: auto; }
    .module-metric { font-weight: 700; color: #0f172a; font-size: 1rem; }
    .module-link { color: #4f46e5; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.rem; padding-left: 0.45rem; }

    .chart-container { background: white; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e2e8f0; height: 350px; display: flex; flex-direction: column; }
    .chart-header { margin-bottom: 1rem; font-weight: 700; color: #1e293b; }

    .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #64748b; gap: 1rem; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .bg-indigo { background-color: #eef2ff; color: #4f46e5; }
    .bg-emerald { background-color: #ecfdf5; color: #059669; }
    .bg-amber { background-color: #fffbeb; color: #d97706; }
    .bg-rose { background-color: #fff1f2; color: #e11d48; }
  `;
  document.head.appendChild(s);
};

const ExpertDashboard = ({ setCurrentPage }) => {
  initCSS();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingPosts: 0,
    activeConsultations: 0,
    newConsultations: 0,
    activeAlerts: 0,
    consultationStats: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const headers = { Authorization: `Bearer ${token}` };

        // Parallel Fetching
        const [postsRes, consultRes, alertsRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/posts/pending`, { headers }),
          axios.get(`${API_BASE}/api/reports/expert/${userId}`, { headers }),
          axios.get(`${API_BASE}/api/alerts/my/alerts`, { headers })
        ]);

        const newStats = { ...stats };

        // 1. Pending Validation
        if (postsRes.status === 'fulfilled') {
          const data = postsRes.value.data;
          const posts = Array.isArray(data) ? data : (data.posts || []);
          newStats.pendingPosts = posts.length;
        }

        // 2. Consultations
        if (consultRes.status === 'fulfilled') {
          const consults = Array.isArray(consultRes.value.data) ? consultRes.value.data : [];
          newStats.activeConsultations = consults.filter(c => c.status === 'in-progress').length;
          newStats.newConsultations = consults.filter(c => c.status === 'new').length;
          
          // Chart Data
          newStats.consultationStats = [
            { name: 'New', value: consults.filter(c => c.status === 'new').length, color: '#f59e0b' },
            { name: 'In Progress', value: consults.filter(c => c.status === 'in-progress').length, color: '#3b82f6' },
            { name: 'Resolved', value: consults.filter(c => c.status === 'resolved').length, color: '#10b981' }
          ].filter(d => d.value > 0);
        }

        // 3. Alerts
        if (alertsRes.status === 'fulfilled') {
          newStats.activeAlerts = Array.isArray(alertsRes.value.data) ? alertsRes.value.data.length : 0;
        }

        setStats(newStats);
      } catch (error) {
        console.error("Expert Dashboard Fetch Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <Activity className="animate-spin" size={48} />
        <p>Loading expert insights...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <div className="dash-header">
        <h1 className="dash-title">Expert Overview</h1>
        <p className="dash-subtitle">Manage agricultural insights, validations, and farmer consultations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpi">
        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Validation</div>
            <div className="stat-value">{stats.pendingPosts}</div>
            <div className="stat-desc">Community posts to review</div>
          </div>
          <div className="stat-icon bg-indigo"><ShieldCheck size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">New Consultations</div>
            <div className="stat-value">{stats.newConsultations}</div>
            <div className="stat-desc">Farmer requests awaiting reply</div>
          </div>
          <div className="stat-icon bg-amber"><MessageSquare size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active Alerts</div>
            <div className="stat-value">{stats.activeAlerts}</div>
            <div className="stat-desc">Broadcasts currently live</div>
          </div>
          <div className="stat-icon bg-rose"><Megaphone size={24} /></div>
        </div>
      </div>

      {/* Modules */}
      <h2 className="section-title"><Activity size={20} /> Quick Actions</h2>
      <div className="grid-modules">
        <div className="module-card" onClick={() => setCurrentPage && setCurrentPage('validation')}>
          <div className="module-icon bg-indigo"><ShieldCheck size={24} /></div>
          <h3 className="module-title">Content Validation</h3>
          <p className="module-desc">Review and verify community posts to ensure agricultural accuracy.</p>
          <div className="module-footer">
            <span className="module-metric">{stats.pendingPosts} Pending</span>
            <span className="module-link">Review <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage && setCurrentPage('messages')}>
          <div className="module-icon bg-amber"><MessageSquare size={24} /></div>
          <h3 className="module-title">Consultations</h3>
          <p className="module-desc">Respond to direct queries from farmers regarding crops and pests.</p>
          <div className="module-footer">
            <span className="module-metric">{stats.newConsultations} New </span>
            <span className="module-link"> Respond <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage && setCurrentPage('alerts')}>
          <div className="module-icon bg-rose"><Megaphone size={24} /></div>
          <h3 className="module-title">Broadcast Alerts</h3>
          <p className="module-desc">Send critical weather or pest warnings to farmers in your region.</p>
          <div className="module-footer">
            <span className="module-metric">{stats.activeAlerts} Active</span>
            <span className="module-link">Manage <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage && setCurrentPage('disasters')}>
          <div className="module-icon bg-emerald"><AlertTriangle size={24} /></div>
          <h3 className="module-title">Disaster Insights</h3>
          <p className="module-desc">Monitor regional disaster risks and automated predictions.</p>
          <div className="module-footer">
            <span className="module-metric">Risk Analysis</span>
            <span className="module-link">View <ArrowRight size={16} /></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;