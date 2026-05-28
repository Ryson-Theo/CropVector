// farmer_dashboard.js
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  ShoppingCart, DollarSign, Sprout, Tractor, RefreshCw, Package, MapPin, ClipboardList
} from "lucide-react";
import "./farmer_dashboard.css";

/**
 * Farmer Dashboard
 * Shows a summary: revenue, active crops, orders, and rentals with charts.
 */

const FarmerDashboard = ({ onNavigate }) => {
  const farmerId = localStorage.getItem("farmerId"); // Specific to Farmer model, used for rentals
  const userId = localStorage.getItem("userId"); // General user ID, used for orders, etc.
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const getUrl = (endpoint) => {
    const base = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
    return `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  };

  const fetchDashboardData = async () => {
    if (!userId || !token) return {
      stats: {
        totalRevenue: 0,
        activeCrops: 0,
        pendingOrders: 0,
        activeRentals: 0,
        inventoryCount: 0,
        fieldsCount: 0
      },
      revenueData: [],
      cropDistribution: [],
      recentOrders: []
    };

    console.log("Dashboard fetching for userId:", userId, "and farmerId:", farmerId);

    const [ordersRes, rentalsRes, cropsRes, invRes, fieldsRes] = await Promise.all([
      fetch(getUrl(`/marketplace/orders?userId=${userId}`), {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(getUrl(`/machinery/owner-requests/${farmerId || userId}`), {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(getUrl(`/farmer/crops`), {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(getUrl(`/inventory?farmerId=${userId}`), {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(getUrl(`/fields`), {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const ordersData = await ordersRes.json();
    const rentalsData = await rentalsRes.json();
    const cropsData = await cropsRes.json();
    const invData = await invRes.json();
    const fieldsData = await fieldsRes.json();

    const myOrders = (ordersData.orders || [])
      .filter(o => (o.farmerId?._id === userId || o.farmerId === userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const myRentals = Array.isArray(rentalsData) ? rentalsData : [];
    const cropRevenue = myOrders.filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const rentalRevenue = myRentals.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status))
      .reduce((sum, r) => sum + (r.totalCost || 0), 0);

    const revMap = {};
    myOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      const d = new Date(o.createdAt);
      if (!isNaN(d)) {
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revMap[dateStr] = (revMap[dateStr] || 0) + (o.totalPrice || 0);
      }
    });
    myRentals.filter(r => !['pending', 'rejected', 'cancelled'].includes(r.status)).forEach(r => {
      const d = new Date(r.createdAt || r.startDate);
      if (!isNaN(d)) {
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revMap[dateStr] = (revMap[dateStr] || 0) + (r.totalCost || 0);
      }
    });

    const chartData = Object.keys(revMap).map(date => ({ date, revenue: revMap[date] })).slice(-7);
    const pending = myOrders.filter(o => o.status === 'pending').length;
    const activeRentalsCount = myRentals.filter(r => ['approved', 'picked-up', 'returning'].includes(r.status)).length;
    const activeCropsCount = Array.isArray(cropsData) ? cropsData.length : 0;

    const cropMap = {};
    if (Array.isArray(cropsData)) {
      cropsData.forEach(c => { cropMap[c.category] = (cropMap[c.category] || 0) + 1; });
    }

    const pieData = Object.keys(cropMap).map(key => ({ name: key, value: cropMap[key] }));
    const invCount = Array.isArray(invData) ? invData.length : 0;
    const fieldsCount = Array.isArray(fieldsData) ? fieldsData.length : 0;
    const totalRevenue = cropRevenue + rentalRevenue;

    return {
      stats: {
        totalRevenue,
        activeCrops: activeCropsCount,
        pendingOrders: pending,
        activeRentals: activeRentalsCount,
        inventoryCount: invCount,
        fieldsCount
      },
      revenueData: chartData,
      cropDistribution: pieData,
      recentOrders: myOrders.slice(0, 5)
    };
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["farmerDashboard", userId, farmerId, token],
    queryFn: fetchDashboardData,
    enabled: !!userId && !!token,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 0
  });

  const stats = data?.stats || {
    totalRevenue: 0,
    activeCrops: 0,
    pendingOrders: 0,
    activeRentals: 0,
    inventoryCount: 0,
    fieldsCount: 0
  };
  const revenueData = data?.revenueData || [];
  const cropDistribution = data?.cropDistribution || [];
  const recentOrders = data?.recentOrders || [];

  const loading = isLoading;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="farmer-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Farm Overview</h1>
          <p>Monitor your crops, sales, and equipment performance.</p>
        </div>
        <button onClick={refetch} className="refresh-btn" disabled={loading}>
          <RefreshCw size={18} className={loading ? "spin" : ""} /> 
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigate && onNavigate('orders')}>
          <div className="stat-icon-wrapper revenue"><DollarSign size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Total Revenue</p>
            <h3 className="stat-value">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate && onNavigate('management')}>
          <div className="stat-icon-wrapper crops"><Sprout size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Active Crops</p>
            <h3 className="stat-value">{stats.activeCrops}</h3>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate && onNavigate('orders')}>
          <div className="stat-icon-wrapper orders"><ShoppingCart size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Pending Orders</p>
            <h3 className="stat-value">{stats.pendingOrders}</h3>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate && onNavigate('my-bookings')}>
          <div className="stat-icon-wrapper rentals"><Tractor size={24} /></div>
          <div className="stat-content">
            <p className="stat-title">Active Rentals</p>
            <h3 className="stat-value">{stats.activeRentals}</h3>
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <h2 className="chart-title">Quick Access</h2>
      <div className="modules-grid">
         <div className="module-card" onClick={() => onNavigate && onNavigate('management')}>
            <div className="module-icon"><ClipboardList size={24} /></div>
            <h3 className="module-title">Crop Management</h3>
            <p className="module-desc">Manage crop cycles & health</p>
         </div>
         <div className="module-card" onClick={() => onNavigate && onNavigate('fieldManagement')}>
            <div className="module-icon"><MapPin size={24} /></div>
            <h3 className="module-title">Field Management</h3>
            <p className="module-desc">{stats.fieldsCount} Fields Registered</p>
         </div>
         <div className="module-card" onClick={() => onNavigate && onNavigate('inventory')}>
            <div className="module-icon"><Package size={24} /></div>
            <h3 className="module-title">Inventory</h3>
            <p className="module-desc">{stats.inventoryCount} Items in Stock</p>
         </div>
         <div className="module-card" onClick={() => onNavigate && onNavigate('rental-market')}>
            <div className="module-icon"><Tractor size={24} /></div>
            <h3 className="module-title">Equipment Market</h3>
            <p className="module-desc">Rent or lease machinery</p>
         </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h2 className="chart-title">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => `₹${value}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Crop Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cropDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {cropDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="table-card">
        <h2 className="chart-title">Recent Orders</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No recent orders</td></tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order._id}>
                    <td>#{order._id.substring(0, 6)}</td>
                    <td>{order.listingId?.title || 'Unknown Item'}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>₹{(order.totalPrice || 0).toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: order.status === 'delivered' ? '#dcfce7' : order.status === 'pending' ? '#fef3c7' : '#f1f5f9',
                        color: order.status === 'delivered' ? '#166534' : order.status === 'pending' ? '#92400e' : '#475569'
                      }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
