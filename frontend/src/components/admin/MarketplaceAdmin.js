import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingCart, DollarSign, Users, Filter, Calendar } from 'lucide-react';
import './MarketplaceAdmin.css';

export default function MarketplaceAdmin(){
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || '';
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (dateRange === 'custom' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else if (dateRange === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.append('startDate', d.toISOString().split('T')[0]);
      } else if (dateRange === 'month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        params.append('startDate', d.toISOString().split('T')[0]);
      }

      const url = `${API_URL}/api/marketplace/admin/stats?${params.toString()}`;
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-fade-in"><h3>Loading marketplace statistics…</h3></div>;
  if (!stats) return <div className="page-fade-in"><h3>Failed to load statistics</h3></div>;

  // Prepare chart data
  const revenueData = stats.dailyRevenue || [];
  const topFarmers = stats.topFarmers || [];
  const orderStatusData = stats.ordersByStatus || [];

  return (
    <div className="marketplace-admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Marketplace Analytics</h1>
          <p>Monitor sales, revenue, and farmer performance.</p>
        </div>
      </div>
      
      {/* Date Range Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <Filter size={16} />
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="custom-date-group">
            <Calendar size={16} />
            <input 
              type="date" 
              value={startDate || ''} 
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>to</span>
            <input 
              type="date" 
              value={endDate || ''} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper orders"><ShoppingCart size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Total Orders</p>
            <h3 className="stat-value">{stats.totalOrders || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper revenue"><DollarSign size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Total Revenue</p>
            <h3 className="stat-value">₹{(stats.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper avg-order"><TrendingUp size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Avg. Order Value</p>
            <h3 className="stat-value">₹{stats.totalOrders ? (stats.revenue / stats.totalOrders).toFixed(2) : '0'}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper farmers"><Users size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Active Farmers</p>
            <h3 className="stat-value">{stats.activeFarmers || 0}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Daily Revenue Trend */}
        {revenueData.length > 0 && (
          <div className="chart-card">
            <h2 className="chart-title">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', color: '#fff', borderRadius: '8px' }}
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Line type="monotone" dataKey="revenue" stroke="#2aa84f" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status Distribution */}
        {orderStatusData.length > 0 && (
          <div className="chart-card">
            <h2 className="chart-title">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {['#2aa84f', '#1a7c36', '#f59e0b', '#0284c7', '#dc2626'].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Farmers Table */}
      {topFarmers.length > 0 && (
        <div className="table-card">
          <h2 className="chart-title">Top Performing Farmers</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Farmer ID</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topFarmers.map((farmer, idx) => (
                <tr key={idx}>
                  <td className="farmer-id-cell">{farmer.farmerId || 'N/A'}</td>
                  <td className="text-right">{farmer.orderCount}</td>
                  <td className="text-right revenue-cell">₹{(farmer.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
