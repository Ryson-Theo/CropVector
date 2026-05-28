import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Megaphone,
  MessageSquare, User, Settings, LogOut, ChevronRight, Bell, Zap
  , AlertTriangle
} from "lucide-react";
import { parseFetchResponse, authHeaders } from "../../utils/fetchHelper";
import "./ExpertSubPages.css"; // Reuse  layout CSS

// Importing Expert sub-pages
import ExpertDashboard from "./ExpertDashboard"; // Verification & Overview
import ContentValidation from "./ContentValidation"; // Content validation
import BroadcastAlerts from "./BroadcastAlerts"; // Broadcast system
import ExpertMessages from "./ExpertMessages"; // Farmer consults
import ExpertProfile from "./ExpertProfile";
import ExpertSettings from "./ExpertSettings";
import CommunityFeed from "../community/CommunityFeed";
import DisasterInsights from "../admin/DisasterInsights";

const ExpertLayout = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSync, setShowSync] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const acknowledgedCountRef = useRef(0);
  const hiddenIdsRef = useRef([]);
  const fetchPromiseRef = useRef(null);
  const navigate = useNavigate();

  // --- SECURITY GATE: Check Expert Role ---
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const status = localStorage.getItem("userStatus");

    if (!role || role !== "expert") {
      navigate("/login");
    } else if (status === "pending") {
      navigate("/pending-approval");
    }
  }, [navigate]);

  // Backend Ready: Expert State
  const [currentUser, setCurrentUser] = useState({
    name: localStorage.getItem("userName") || "Expert",
    role: "Agricultural Specialist",
    notifications: 0,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem("userName") || 'Expert'}`
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

        let avatarUrl = currentUser.avatar;
        let name = currentUser.name;
        let notifs = [];

        if (email && token) {
          try {
            const res = await fetch(getUrl(`/auth/profile?email=${email}`), {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-cache",
            });
            if (res.ok) {
              const data = await res.json();
              if (data.fullName) {
                name = data.fullName;
                localStorage.setItem("userName", data.fullName);
              }
              if (data.profilePic) {
                const pic = data.profilePic.replace(/\\/g, '/');
                avatarUrl = pic.startsWith("http") ? pic : `${SERVER_BASE}/${pic}`;
              }
            }
          } catch (err) {
            console.error("Profile fetch error", err);
          }

          if (userId) {
            try {
              const msgRes = await fetch(getUrl(`/messages/conversations/${userId}`), {
                headers: authHeaders(token),
              });
              const convs = await parseFetchResponse(msgRes);
              if (msgRes.ok && Array.isArray(convs)) {
                const unread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                if (unread > 0) {
                  notifs.push({ id: `msgs-${unread}`, text: `You have ${unread} unread messages`, view: 'messages', time: 'Now' });
                }
              }
            } catch(e) {
              console.error("Msg fetch error", e?.message || e);
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Visual Sync Logic
  useEffect(() => {
    setShowSync(true);
    const timer = setTimeout(() => setShowSync(false), 2000);
    return () => clearTimeout(timer);
  }, [currentPage]);

  // Menu items tailored to Expert responsibilities
  const menuItems = [
    { name: "Expert Insights", icon: <LayoutDashboard size={18} />, view: "dashboard" },
    { name: "Content Validation", icon: <ShieldCheck size={18} />, view: "validation" },
    { name: "Community Feed", icon: <Megaphone size={18} />, view: "community" },
    { name: "Broadcast Alerts", icon: <Megaphone size={18} />, view: "alerts" },
    { name: "Disaster Insights", icon: <AlertTriangle size={18} />, view: "disasters" },
    { name: "Consultations", icon: <MessageSquare size={18} />, view: "messages" },
    // Moderation stats removed for Experts — content validation handles moderation actions
    { name: "Profile", icon: <User size={18} />, view: "profile" },
    { name: "Settings", icon: <Settings size={18} />, view: "settings" },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <ExpertDashboard setCurrentPage={setCurrentPage} />;
      case "validation": return <ContentValidation />;
      case "community": return <CommunityFeed userRole="expert" />;
      case "alerts": return <BroadcastAlerts />;
      case "disasters": return <DisasterInsights />;
      case "messages": return <ExpertMessages />;
      case "profile": return <ExpertProfile />;
      case "settings": return <ExpertSettings />;
      default: return <ExpertDashboard />;
    }
  };

  const handleLogout = () => {
    if (window.confirm("Logout from Expert Panel?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="farmer-layout"> {/* Using same CSS class for layout consistency */}
      <aside className="farmer-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <Zap size={24} className="text-yellow-500 fill-yellow-500" />
            <span className="logo-text">CROP<span className="text-green-600">VECTOR</span></span>
          </div>
          <div className="panel-tag" style={{ background: '#4f46e5' }}>EXPERT</div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((it) => (
            <div
              key={it.name}
              className={`menu-item ${currentPage === it.view ? "active" : ""}`}
              onClick={() => setCurrentPage(it.view)}
            >
              <div className="menu-icon">{it.icon}</div>
              <span className="menu-text">{it.name}</span>
              {currentPage === it.view && <ChevronRight size={14} className="active-arrow" />}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <LogOut size={18} />
          <span>Logout Session</span>
        </div>
      </aside>

      <main className="farmer-content">
        <header className="farmer-topbar">
          <div className="topbar-left">
            <h2>{menuItems.find(m => m.view === currentPage)?.name}</h2>
            {showSync && (
              <div className="sync-notify">
                <div className="sync-indicator"></div>
                Syncing Knowledge Hub...
              </div>
            )}
          </div>

          <div className="topbar-right">
            <div style={{ position: 'relative', marginRight: '10px' }}>
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
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden', color: 'black'
                }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', fontWeight: '600', color: '#111827' }}>Notifications</div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notificationsList.length > 0 ? (
                      notificationsList.map((n, i) => (
                        <div key={i} onClick={() => { setCurrentPage(n.view); setShowNotifications(false); }} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>{n.text}</div>
                      ))
                    ) : <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>No new notifications</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="user-pill" onClick={() => setCurrentPage("profile")} style={{ cursor: 'pointer' }}>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-status">{currentUser.role}</span>
              </div>
              <div className="user-avatar" style={{ border: '2px solid #4f46e5' }}>
                <img src={currentUser.avatar} alt="Expert Avatar" />
              </div>
            </div>
          </div>
        </header>

        <div className="farmer-page-container">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default ExpertLayout;