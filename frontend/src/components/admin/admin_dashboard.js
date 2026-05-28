import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Users,
  UserCheck,
  DollarSign,
  AlertTriangle,
  Activity,
  ShoppingCart,
  FileText,
  ShieldAlert,
  Leaf,
  ArrowRight,
  TrendingUp,
  Settings
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

let dashboardStatsCache = null;
let dashboardStatsPromise = null;

const fetchDashboardStatsOnce = async (API, headers) => {
  if (dashboardStatsCache && (Date.now() - dashboardStatsCache.ts) < 60 * 1000) {
    return dashboardStatsCache.data;
  }
  if (dashboardStatsPromise) return dashboardStatsPromise;

  dashboardStatsPromise = (async () => {
    const [usersRes, marketRes, reportsRes, moderationRes] = await Promise.allSettled([
      axios.get(`${API}/auth/admin/users`, { headers }),
      axios.get(`${API}/marketplace/admin/stats`, { headers }),
      axios.get(`${API}/reports?type=issue`, { headers }),
      axios.get(`${API}/moderation/stats`, { headers })
    ]);

    const newStats = {
      users: [],
      revenue: 0,
      totalOrders: 0,
      reports: [],
      pendingExperts: 0,
      unverifiedPosts: 0,
      revenueTrend: []
    };

    if (usersRes.status === 'fulfilled' && usersRes.value.data) {
      const data = usersRes.value.data;
      newStats.users = Array.isArray(data) ? data : (data.users || []);
      newStats.pendingExperts = newStats.users.filter(u => u.role === 'expert' && u.status === 'pending').length;
    }

    if (marketRes.status === 'fulfilled' && marketRes.value.data) {
      const mData = marketRes.value.data;
      newStats.revenue = mData.revenue || 0;
      newStats.totalOrders = mData.totalOrders || 0;
      if (mData.dailyRevenue && Array.isArray(mData.dailyRevenue)) {
        newStats.revenueTrend = mData.dailyRevenue
          .slice(-7)
          .map(d => ({
            name: new Date(d.date || d._id).toLocaleDateString('en-US', { weekday: 'short' }),
            value: d.revenue
          }));
      }
    }

    if (reportsRes.status === 'fulfilled' && reportsRes.value.data) {
      newStats.reports = Array.isArray(reportsRes.value.data) ? reportsRes.value.data : [];
    }

    if (moderationRes.status === 'fulfilled' && moderationRes.value.data) {
      newStats.unverifiedPosts = moderationRes.value.data.pendingPosts || 0;
    } else if (moderationRes.status === 'rejected' && moderationRes.reason?.response?.status === 404) {
      try {
        const flaggedRes = await axios.get(`${API}/posts/flagged`, { headers });
        if (flaggedRes.data) {
          const flaggedData = flaggedRes.data;
          const posts = Array.isArray(flaggedData) ? flaggedData : (flaggedData.posts || []);
          newStats.unverifiedPosts = posts.length;
        }
      } catch (e) {
        console.warn("Moderation fallback failed", e);
      }
    }

    dashboardStatsCache = { ts: Date.now(), data: newStats };
    dashboardStatsPromise = null;
    return newStats;
  })();

  return dashboardStatsPromise;
};

/* ================= CSS INIT ================= */
const initCSS = () => {
  if (document.getElementById("dashboard-css")) return;
  const s = document.createElement("style");
  s.id = "dashboard-css";
  s.innerHTML = `
    .dash-container { padding: 2.5rem; background-color: #f8fafc; min-height: 100%; font-family: 'Inter', system-ui, sans-serif; color: #1e293b; }
    .dash-header { margin-bottom: 2.5rem; }
    .dash-title { font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
    .dash-subtitle { color: #64748b; font-size: 1rem; font-weight: 400; }
    
    .section-title { font-size: 1.25rem; font-weight: 700; color: #334155; margin: 3rem 0 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
    
    .grid-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
    .grid-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
    .grid-modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

    .stat-card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.2s ease; display: flex; justify-content: space-between; align-items: center; }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.08); border-color: #cbd5e1; }
    .stat-icon { padding: 0.75rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
    .stat-label { font-size: 0.875rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1; }
    .stat-desc { font-size: 0.875rem; color: #94a3b8; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem; }

    .module-card { background: white; border-radius: 1rem; padding: 1.75rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; height: 100%; transition: all 0.2s; cursor: pointer; position: relative; overflow: hidden; }
    .module-card:hover { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); transform: translateY(-2px); }
    .module-icon { width: 48px; height: 48px; border-radius: 12px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .module-title { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
    .module-desc { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; flex-grow: 1; line-height: 1.5; }
    .module-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-top: auto; }
    .module-metric { font-weight: 700; color: #0f172a; font-size: 1.1rem; }
    .module-link { color: #3b82f6; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; padding-left:0.45rem; }

    .chart-container { background: white; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e2e8f0; height: 420px; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .chart-header { margin-bottom: 1.5rem; }
    .chart-title { font-size: 1.125rem; font-weight: 700; color: #1e293b; }

    .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: #64748b; gap: 1rem; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Colors for icons */
    .bg-blue { background-color: #eff6ff; color: #2563eb; }
    .bg-green { background-color: #f0fdf4; color: #16a34a; }
    .bg-amber { background-color: #fffbeb; color: #d97706; }
    .bg-purple { background-color: #f3e8ff; color: #7c3aed; }
    .bg-rose { background-color: #fff1f2; color: #e11d48; }
  `;
  document.head.appendChild(s);
};

/* ================= DASHBOARD ================= */
const DashboardView = ({ setCurrentPage, refreshTick }) => {
  initCSS();

  // Align API base URL with other admin components (e.g. admin_reports.js)
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const API = `${API_BASE}/api`;
  
  const token = localStorage.getItem("token");
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: [],
    revenue: 0,
    totalOrders: 0,
    reports: [],
    pendingExperts: 0,
    unverifiedPosts: 0,
    revenueTrend: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!stats.users.length) setLoading(true);
        const newStats = await fetchDashboardStatsOnce(API, headers);
        setStats(prev => ({ ...prev, ...newStats }));
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API, headers, refreshTick]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const totalUsers = stats.users.length;
    const farmers = stats.users.filter(u => u.role === 'farmer').length;
    const buyers = stats.users.filter(u => u.role === 'buyer').length;
    const experts = stats.users.filter(u => u.role === 'expert').length;
    const admins = stats.users.filter(u => u.role === 'admin').length;
    const communityUsers = stats.users.filter(u => u.role === 'user').length;
    const activeReports = stats.reports.filter(r => r.status === 'new' || r.status === 'in-progress').length;

    return { totalUsers, farmers, buyers, experts, admins, communityUsers, activeReports };
  }, [stats]);

  // Chart Data
  const roleDistribution = [
    { name: 'Farmers', value: metrics.farmers, color: '#16a34a' },
    { name: 'Buyers', value: metrics.buyers, color: '#2563eb' },
    { name: 'Experts', value: metrics.experts, color: '#7c3aed' },
    { name: 'Admins', value: metrics.admins, color: '#5b21b6' },
    { name: 'Users', value: metrics.communityUsers, color: '#64748b' }
  ].filter(d => d.value > 0);

  // Use real trend data if available, otherwise fallback to mock for visualization
  const revenueTrend = stats.revenueTrend.length > 0 ? stats.revenueTrend : [
    { name: 'Mon', value: stats.revenue * 0.1 },
    { name: 'Tue', value: stats.revenue * 0.15 },
    { name: 'Wed', value: stats.revenue * 0.12 },
    { name: 'Thu', value: stats.revenue * 0.2 },
    { name: 'Fri', value: stats.revenue * 0.18 },
    { name: 'Sat', value: stats.revenue * 0.25 },
    { name: 'Sun', value: stats.revenue * 0.3 } // Just for visualization
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <Activity className="animate-spin" size={48} />
        <p>Gathering system intelligence...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <div className="dash-header">
        <h1 className="dash-title">System Overview</h1>
        <p className="dash-subtitle">Welcome back, Administrator. Here's what's happening across the platform today.</p>
      </div>

      {/* Top Level Stats */}
      <div className="grid-kpi">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{metrics.totalUsers}</div>
            <div className="stat-desc"><TrendingUp size={14} /> Active community base</div>
          </div>
          <div className="stat-icon bg-blue"><Users size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{stats.revenue.toLocaleString('en-IN')}</div>
            <div className="stat-desc">From {stats.totalOrders} completed orders</div>
          </div>
          <div className="stat-icon bg-green"><DollarSign size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Experts</div>
            <div className="stat-value">{stats.pendingExperts}</div>
            <div className="stat-desc" style={{ color: stats.pendingExperts > 0 ? '#d97706' : '#94a3b8' }}>
              {stats.pendingExperts > 0 ? 'Requires verification' : 'All caught up'}
            </div>
          </div>
          <div className="stat-icon bg-purple"><UserCheck size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Open Issues</div>
            <div className="stat-value">{metrics.activeReports}</div>
            <div className="stat-desc">User reported incidents</div>
          </div>
          <div className="stat-icon bg-rose"><AlertTriangle size={24} /></div>
        </div>
      </div>

      {/* Visual Data */}
      <h2 className="section-title"><Activity size={20} /> Analytics & Trends</h2>
      <div className="grid-charts">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">User Demographics</h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="#1e293b">{metrics.totalUsers}</tspan>
                <tspan x="50%" dy="1.5em" fontSize="14" fill="#64748b">Total Users</tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            {roleDistribution.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }}></div>
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Revenue Activity (Est.)</h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module Navigation & Overview */}
      <h2 className="section-title"><Settings size={20} /> Management Modules</h2>
      <div className="grid-modules">
        
        <div className="module-card" onClick={() => setCurrentPage('users')}>
          <div className="module-icon bg-blue"><Users size={24} /></div>
          <h3 className="module-title">User Management</h3>
          <p className="module-desc">Manage user accounts, roles, and access permissions across the platform.</p>
          <div className="module-footer">
            <span className="module-metric">{metrics.totalUsers} Users</span>
            <span className="module-link">Manage <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage('experts')}>
          <div className="module-icon bg-purple"><UserCheck size={24} /></div>
          <h3 className="module-title">Expert Verification</h3>
          <p className="module-desc">Review credentials and approve new agricultural experts.</p>
          <div className="module-footer">
            <span className="module-metric" style={{ color: stats.pendingExperts > 0 ? '#d97706' : 'inherit' }}>
              {stats.pendingExperts} Pending
            </span>
            <span className="module-link">Review <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage('marketplace')}>
          <div className="module-icon bg-green"><ShoppingCart size={24} /></div>
          <h3 className="module-title">Marketplace</h3>
          <p className="module-desc">Monitor transactions, revenue streams, and farmer sales performance.</p>
          <div className="module-footer">
            <span className="module-metric">₹{stats.revenue.toLocaleString('en-IN')}</span>
            <span className="module-link">View Stats <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage('moderation')}>
          <div className="module-icon bg-amber"><ShieldAlert size={24} /></div>
          <h3 className="module-title">Content Moderation</h3>
          <p className="module-desc">Oversee community posts and ensure content guidelines are met.</p>
          <div className="module-footer">
            <span className="module-metric">{stats.unverifiedPosts} Unverified</span>
            <span className="module-link">Moderate <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage('reports')}>
          <div className="module-icon bg-rose"><FileText size={24} /></div>
          <h3 className="module-title">Issue Reports</h3>
          <p className="module-desc">Resolve user complaints and technical issues reported by the community.</p>
          <div className="module-footer">
            <span className="module-metric">{metrics.activeReports} Active</span>
            <span className="module-link">Resolve <ArrowRight size={16} /></span>
          </div>
        </div>

        <div className="module-card" onClick={() => setCurrentPage('crops')}>
          <div className="module-icon bg-green"><Leaf size={24} /></div>
          <h3 className="module-title">Crop Audit</h3>
          <p className="module-desc">Maintain crop standards and recommendation engine parameters.</p>
          <div className="module-footer">
            <span className="module-metric">System Data</span>
            <span className="module-link">Audit <ArrowRight size={16} /></span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;