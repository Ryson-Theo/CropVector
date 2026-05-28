import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Clock,
  Wallet,
  Truck,
  CheckCircle,
  Package,
  MessageSquare
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "react-toastify";
import "./BuyerDashboard.css";
import { fetchOnce } from "../../utils/requestCache";

const BuyerDashboard = ({ setCurrentPage }) => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Buyer");

  const [stats, setStats] = useState({
    totalSpend: 0,
    activeOrders: 0,
    pendingPickups: 0,
    deliveredOrders: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [spendData, setSpendData] = useState([]);
  const [categorySpendData, setCategorySpendData] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const getApiUrl = (endpoint) => {
    return API_URL.includes("/api") ? `${API_URL}${endpoint}` : `${API_URL}/api${endpoint}`;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const userId =
          localStorage.getItem("userId") || sessionStorage.getItem("userId");

        setUserName(localStorage.getItem("userName") || "Buyer");

        if (!token || !userId) {
          setLoading(false);
          return;
        }

        let orders = [];
        try {
          orders = await fetchOnce(
            `buyerOrders:${userId}`,
            async () => {
              const res = await fetch(
                getApiUrl(`/marketplace/orders?userId=${userId}`),
                { headers: { Authorization: `Bearer ${token}` } }
              );

              const data = await res.json();
              if (!res.ok || !Array.isArray(data.orders)) {
                throw new Error("Invalid order response");
              }
              return data.orders;
            },
            60 * 1000
          );
        } catch (err) {
          console.error("Dashboard order fetch warning:", err.message || err);
          toast.error("Unable to load order summary right now");
          orders = [];
        }

        processOrders(orders);
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const processOrders = (orders) => {
    const validOrders = orders.filter(o => o.status !== "cancelled");

    const totalSpend = validOrders.reduce(
      (sum, o) => sum + (Number(o.totalPrice) || 0),
      0
    );

    const activeOrders = orders.filter(o =>
      ["pending", "confirmed", "shipped"].includes(o.status)
    ).length;

    const pendingPickups = orders.filter(
      o => o.status === "confirmed" && o.deliveryType === "pickup"
    ).length;

    const deliveredOrders = orders.filter(
      o => o.status === "delivered"
    ).length;

    setStats({
      totalSpend,
      activeOrders,
      pendingPickups,
      deliveredOrders
    });

    /* -------- Monthly Spend (last 6 months) -------- */
    const monthlyMap = {};

    validOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (Number(o.totalPrice) || 0);
    });

    const monthlyChart = Object.entries(monthlyMap)
      .map(([key, spend]) => {
        const [y, m] = key.split("-");
        const date = new Date(y, m - 1);
        return {
          key,
          name: date.toLocaleString("default", { month: "short", year: "2-digit" }),
          spend
        };
      })
      .sort((a, b) => new Date(a.key) - new Date(b.key))
      .slice(-6);

    setSpendData(monthlyChart);

    /* -------- Category Spend -------- */
    const categoryMap = {};

    validOrders.forEach(o => {
      const category = o.listingId?.category;
      if (!category) return;
      categoryMap[category] =
        (categoryMap[category] || 0) + (Number(o.totalPrice) || 0);
    });

    setCategorySpendData(
      Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="dashboard-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Spend",
      value: `₹${stats.totalSpend.toLocaleString("en-IN")}`,
      icon: <Wallet size={24} />,
      color: "blue"
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      icon: <ShoppingBag size={24} />,
      color: "green"
    },
    {
      title: "Pending Pickups",
      value: stats.pendingPickups,
      icon: <Clock size={24} />,
      color: "orange"
    },
    {
      title: "Completed Orders",
      value: stats.deliveredOrders,
      icon: <CheckCircle size={24} />,
      color: "purple"
    }
  ];

  const PIE_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#dcfce7"];

  return (
    <div className="insights-container">
      {/* WELCOME */}
      <div className="welcome-banner">
        <h1>Welcome back, {userName}!</h1>
        <p>Your marketplace activity at a glance</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-header">
              <div className="stat-icon-wrapper">{s.icon}</div>
            </div>
            <div className="stat-body">
              <p className="stat-title">{s.title}</p>
              <h3 className="stat-value">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="dashboard-grid">
        {/* MONTHLY SPEND */}
        <div className="spend-chart-card">
          <div className="card-header"><h3>Monthly Spend</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={spendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="spend" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CATEGORY PIE */}
        <div className="category-spend-card">
          <div className="card-header"><h3>Spend by Category</h3></div>
          {categorySpendData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categorySpendData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {categorySpendData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-placeholder">No category data yet</div>
          )}
        </div>

        {/* RECENT ORDERS */}
        <div className="recent-orders-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="view-all-btn" onClick={() => setCurrentPage("orders")}>
              View All
            </button>
          </div>

          <div className="order-list">
            {recentOrders.length ? recentOrders.map(o => (
              <div key={o._id} className="order-item" onClick={() => setCurrentPage("orders")}>
                <div className="truck-icon"><Truck size={20} /></div>
                <div className="order-details">
                  <span className="order-id">#{o._id.slice(0, 8)}</span>
                  <span className="order-desc">
                    {o.listingId?.title || "Item"} · {o.quantity} {o.listingId?.unit}
                  </span>
                </div>
                <div className={`order-status-pill ${o.status}`}>
                  {o.status}
                </div>
              </div>
            )) : (
              <div className="no-data-placeholder">No recent orders</div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="quick-actions-card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="quick-actions-buttons">
            <button className="action-button primary" onClick={() => setCurrentPage("marketplace")}>
              <ShoppingBag size={18} /> Browse Marketplace
            </button>
            <button className="action-button" onClick={() => setCurrentPage("orders")}>
              <Package size={18} /> Track Orders
            </button>
            <button className="action-button" onClick={() => setCurrentPage("messages")}>
              <MessageSquare size={18} /> Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;