import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutGrid, Award, User, 
  Settings, LogOut, Bell, AlertTriangle, Sprout, Home
} from "lucide-react";
import "./User_layout.css";

// Importing internal pages
import CommunityFeed from "../community/CommunityFeed";
import Consultation from "./Consultation";
import UserSettings from "./user_settings";
import UserProfile from "./user_profile";
import AlertsViewer from "../community/AlertsViewer";
import HomeGarden from "./HomeGarden";
import UserRecommendations from "./UserRecommendations";

const UserLayout = () => {
  const [currentPage, setCurrentPage] = useState("feed");
  const [showUpdateNotify, setShowUpdateNotify] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const acknowledgedCountRef = useRef(0);
  const hiddenIdsRef = useRef([]);
  const navigate = useNavigate();
  
  // --- SECURITY GATE: Ensure user is allowed here ---
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    
    // If not a standard user, redirect to their specific dashboard or login
    if (!role) {
      navigate("/login");
    } else if (role !== "user") {
      // If a farmer or admin tries to access /user, send them to their role's home
      navigate(`/${role}`);
    }
  }, [navigate]);

  // Pull actual User State from LocalStorage
  const [currentUser, setCurrentUser] = useState({
    name: localStorage.getItem("userName") || "Community Member",
    role: "Verified Member", // Or pull role from DB if you want specific titles
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (localStorage.getItem("userName") || "User"),
    notifications: 0
  });

  useEffect(() => {
    const fetchData = async () => {
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
        } catch (err) { console.error("Profile fetch error", err); }
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
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Notify user of tab updates
  useEffect(() => {
    setShowUpdateNotify(true);
    const timer = setTimeout(() => setShowUpdateNotify(false), 2000);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      localStorage.clear(); // CRITICAL: Clear session
      navigate("/login");
    }
  };

  const menuItems = [
    { name: "Community Feed", icon: <LayoutGrid size={18} />, view: "feed" },
    { name: "My Home Garden", icon: <Sprout size={18} />, view: "garden" },
    { name: "Setup Recommendation", icon: <Home size={18} />, view: "recommendations" },
    { name: "Broadcast Alerts", icon: <AlertTriangle size={18} />, view: "alerts" },
    { name: "Consultation", icon: <Award size={18} />, view: "consultation" },
    { name: "My Profile", icon: <User size={18} />, view: "profile" },
    { name: "Settings", icon: <Settings size={18} />, view: "settings" },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "feed": return <CommunityFeed userRole="user" />;
      case "garden": return <HomeGarden />;
      case "recommendations": return <UserRecommendations />;
      case "alerts": return <AlertsViewer />;
      case "consultation": return <Consultation userRole="user" />;
      case "profile": return <UserProfile />;
      case "settings": return <UserSettings />;
      default: return <CommunityFeed userRole="user" />;
    }
  };

  return (
    <div className="admin-layout"> {/* Keeps same CSS structure for consistency */}
      
      {/* SIDEBAR */}
      <aside className="admin-sidebar" style={{ width: '260px', minWidth: '260px' }}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <LayoutGrid size={22} className="text-blue-500" />
            <span>CROP<span style={{color: "var(--cv-green)"}}>VECTOR</span></span>
          </div>
          <div className="role-tag user" style={{marginTop: '8px', padding: '4px 12px'}}>
            COMMUNITY
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.name}>
                <a 
                  href="#!"
                  className={currentPage === item.view ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(item.view);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="header-left">
            <h2 className="header-title" style={{ textTransform: 'capitalize' }}>
              {currentPage.replace('_', ' ')}
            </h2>
            
            {showUpdateNotify && (
              <div className="sync-notify">
                <div className="sync-indicator"></div>
                Updating data...
              </div>
            )}
          </div>

          <div className="header-right-controls">
            <div className="flex items-center" style={{ marginRight: '8px' }}>
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
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden', color: 'black'
                  }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', fontWeight: '600', color: '#111827' }}>Notifications</div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notificationsList.length > 0 ? (
                        notificationsList.map((n, i) => (
                          <div key={i} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>{n.text}</div>
                        ))
                      ) : <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>No new notifications</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-link" onClick={() => setCurrentPage("profile")} style={{cursor: 'pointer'}}>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{currentUser.role}</span>
              </div>
              <div className="user-avatar" style={{ border: '2px solid var(--cv-green)', padding: '2px' }}>
                <img src={currentUser.avatar} alt="User" className="avatar-img" />
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content-outlet">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;