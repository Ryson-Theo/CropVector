import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ShoppingBag, MessageSquare, 
  Package, Star, Settings, LogOut, Bell, ChevronRight, User 
} from "lucide-react";
import { toast } from "react-toastify";
import { parseFetchResponse, authHeaders } from "../../utils/fetchHelper";
import { fetchOnce } from "../../utils/requestCache";
import "./BuyerDashboard.css"; 

// Import your Sub-pages
import BuyerDashboard from "./BuyerDashboard";
import Marketplace from "./Marketplace";
import BuyerOrders from "./BuyerOrders";
import Messages from "./Messages";
import BuyerProfile from "./BuyerProfile"; // Newly added
import BuyerAccountSettings from "./BuyerAccountSettings";
import CommunityFeed from "../community/CommunityFeed";
import SellerRatings from "./SellerRatings";

const BuyerLayout = () => {
  const [currentPage, setCurrentPage] = useState("insights");
  const [showSync, setShowSync] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const acknowledgedCountRef = useRef(0);
  const hiddenIdsRef = useRef([]);
  const fetchPromiseRef = useRef(null);
  const profileFetchedAtRef = useRef(0);
  const navigate = useNavigate();

  // --- SECURITY GATE: Check Role ---
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "buyer") {
      navigate("/login");
    }
  }, [navigate]);

  // Listen for external requests to open Messages view (from other components)
  useEffect(() => {
    const handler = () => setCurrentPage('messages');
    window.addEventListener('openMessages', handler);
    if (localStorage.getItem('openChatWith')) setCurrentPage('messages');
    return () => window.removeEventListener('openMessages', handler);
  }, []);

  const [currentUser, setCurrentUser] = useState({
    name: localStorage.getItem("userName") || "Buyer",
    role: "Verified Business",
    notifications: 3,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem("userName") || localStorage.getItem("userEmail") || 'Buyer'}`
  });

  useEffect(() => {
    const fetchData = async () => {
      if (fetchPromiseRef.current) {
        return;
      }

      const promise = (async () => {
        const email = localStorage.getItem("userEmail");
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        const getUrl = (ep) => API_BASE.includes("/api") ? `${API_BASE}${ep}` : `${API_BASE}/api${ep}`;
        const SERVER_BASE = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

        let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'Buyer'}`;
        let name = localStorage.getItem("userName") || "Buyer";
        let notifs = [];
        const shouldFetchProfile = Date.now() - profileFetchedAtRef.current > 5 * 60 * 1000;

        if (email && token) {
          if (shouldFetchProfile) {
          try {
            const profileResult = await fetchOnce(
              `buyerProfile:${email}`,
              async () => {
                const res = await fetch(getUrl(`/auth/profile?email=${email}`), {
                  headers: { Authorization: `Bearer ${token}` },
                  cache: "no-cache",
                });
                if (!res.ok) {
                  throw new Error("Profile fetch failed");
                }
                const data = await res.json();
                const result = {
                  name: data.fullName || name,
                  avatar: data.profilePic ? (() => {
                    const pic = data.profilePic.replace(/\\/g, '/');
                    return pic.startsWith("http") ? pic : `${SERVER_BASE}/${pic}`;
                  })() : avatarUrl
                };
                return result;
              },
              5 * 60 * 1000
            );

            name = profileResult.name;
            avatarUrl = profileResult.avatar;
            if (profileResult.name) localStorage.setItem("userName", profileResult.name);
            if (avatarUrl) localStorage.setItem("userAvatar", avatarUrl);
          } catch (err) {
            console.error("Profile fetch warning:", err.message || err);
            const savedAvatar = localStorage.getItem("userAvatar");
            if (savedAvatar) avatarUrl = savedAvatar;
          } finally {
            profileFetchedAtRef.current = Date.now();
          }
        } else {
          const savedAvatar = localStorage.getItem("userAvatar");
          if (savedAvatar) avatarUrl = savedAvatar;
        }

          if (userId) {
            try {
              const convs = await fetchOnce(
                `buyerConversations:${userId}`,
                async () => {
                  const msgRes = await fetch(getUrl(`/messages/conversations/${userId}`), {
                    headers: authHeaders(token),
                  });
                  if (!msgRes.ok) {
                    throw new Error("Conversation fetch failed");
                  }
                  return await parseFetchResponse(msgRes);
                },
                60 * 1000
              );

              if (Array.isArray(convs)) {
                const unread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                if (unread > 0) {
                  notifs.push({ id: `msgs-${unread}`, text: `You have ${unread} unread messages`, view: 'messages', time: 'Now' });
                }
              }
            } catch(e) {
              console.error("Msg fetch warning:", e?.message || e);
            }

            try {
              const ordData = await fetchOnce(
                `buyerOrders:${userId}`,
                async () => {
                  const ordRes = await fetch(getUrl(`/marketplace/orders?userId=${userId}`), {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (!ordRes.ok) {
                    throw new Error("Order fetch failed");
                  }
                  return await ordRes.json();
                },
                60 * 1000
              );

              if (ordData?.orders && Array.isArray(ordData.orders)) {
                const updates = ordData.orders
                  .filter(o => ['shipped', 'delivered', 'confirmed'].includes(o.status))
                  .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .slice(0, 5);
                updates.forEach(o => {
                  notifs.push({ id: o._id, text: `Order #${o._id.substring(0,6)} is ${o.status}`, view: 'orders', time: new Date(o.updatedAt || o.createdAt).toLocaleDateString() });
                });
              }
            } catch(e) {
              console.error("Order fetch warning:", e?.message || e);
            }
          }
        }

        const visibleNotifs = notifs.filter(n => !hiddenIdsRef.current.includes(n.id));
        const currentCount = visibleNotifs.length;
        let ackCount = acknowledgedCountRef.current;

        if (currentCount < ackCount) {
          ackCount = currentCount;
          acknowledgedCountRef.current = ackCount;
        }

        const badgeCount = Math.max(0, currentCount - ackCount);
        setNotificationsList(visibleNotifs);
        setCurrentUser(prev => ({ ...prev, name, avatar: avatarUrl, notifications: badgeCount }));
      })();

      fetchPromiseRef.current = promise;
      try {
        await promise;
      } finally {
        fetchPromiseRef.current = null;
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Auto-Update Sync Notification (Visual only)
  useEffect(() => {
    setShowSync(true);
    const timer = setTimeout(() => setShowSync(false), 1500);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const menuItems = [
    { name: "Business Insights", icon: <LayoutDashboard size={18}/>, view: "insights" },
    { name: "Live Marketplace", icon: <ShoppingBag size={18}/>, view: "marketplace" },
    { name: "My Orders", icon: <Package size={18}/>, view: "orders" },
    { name: "Community Feed", icon: <MessageSquare size={18}/>, view: "community" },
    { name: "Smart Messages", icon: <MessageSquare size={18}/>, view: "messages" },
    { name: "Seller Ratings", icon: <Star size={18}/>, view: "reviews" },
    { name: "My Profile", icon: <User size={18}/>, view: "profile" },
    { name: "Account Settings", icon: <Settings size={18}/>, view: "settings" },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "insights": return <BuyerDashboard setCurrentPage={setCurrentPage} />;
      case "marketplace": return <Marketplace />;
      case "orders": return <BuyerOrders setCurrentPage={setCurrentPage} />;
      case "community": return <CommunityFeed userRole="buyer" />;
      case "messages": return <Messages />;
      case "profile": return <BuyerProfile />;
      case "reviews": return <SellerRatings />;
      case "settings": return <BuyerAccountSettings />;
      default: return <BuyerDashboard setCurrentPage={setCurrentPage} />;
    }
  };

  const handleLogout = () => {
    if (window.confirm("Logout from Buyer Panel?")) {
      toast.info("Logged out successfully");
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="buyer-layout">
      {/* SIDEBAR */}
      <aside className="buyer-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <span className="logo-text">CROP<span style={{color: '#16a34a'}}>VECTOR</span></span>
          </div>
          <div className="panel-tag buyer">BUYER PANEL</div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <div 
              key={item.view} 
              className={`menu-item ${currentPage === item.view ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.view)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.name}</span>
              {currentPage === item.view && <ChevronRight size={14} className="active-arrow" />}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <LogOut size={18} />
          <span>Logout Session</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="buyer-content">
        <header className="buyer-topbar">
          <div className="topbar-left">
            <h2>{menuItems.find(m => m.view === currentPage)?.name}</h2>
            {showSync && (
              <div className="sync-notify">
                <div className="sync-indicator"></div>
                Refreshing Market Data...
              </div>
            )}
          </div>

          <div className="topbar-right">
            <div style={{ position: 'relative' }}>
              <button 
                className="notification-bell-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    acknowledgedCountRef.current = notificationsList.length;
                    setCurrentUser(prev => ({ ...prev, notifications: 0 }));
                  }
                }}
              >
                <Bell size={20} />
                {currentUser.notifications > 0 && (
                  <span className="notification-badge">{currentUser.notifications}</span>
                )}
              </button>
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0, width: '300px',
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', fontWeight: '600', color: '#111827' }}>Notifications</div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notificationsList.length > 0 ? (
                      notificationsList.map((n, i) => (
                        <div key={i} onClick={() => { 
                             hiddenIdsRef.current.push(n.id);
                             setNotificationsList(prev => prev.filter(item => item.id !== n.id));
                             setCurrentPage(n.view); 
                             setShowNotifications(false); 
                           }} 
                             style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                             onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                             onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                          <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '4px' }}>{n.text}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{n.time}</div>
                        </div>
                      ))
                    ) : <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>No new notifications</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Clickable User Pill to go to Profile */}
            <div 
              className="user-pill" 
              onClick={() => setCurrentPage("profile")} 
              style={{ cursor: 'pointer' }}
            >
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-status">{currentUser.role}</span>
              </div>
              <div className="user-avatar" style={{ border: '2px solid #16a34a' }}>
                {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" /> : null}
              </div>
            </div>
          </div>
        </header>

        <div className="buyer-page-container">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default BuyerLayout;