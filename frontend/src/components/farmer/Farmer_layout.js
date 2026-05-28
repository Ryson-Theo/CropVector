import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Sprout, Tractor, ClipboardList, ShoppingCart,
  User, Settings, LogOut, ChevronRight, Bell, LayoutGrid, Award, MessageSquare, AlertTriangle, MapPin, Package, BookOpen
} from "lucide-react";
import { parseFetchResponse, authHeaders } from "../../utils/fetchHelper";
import "./Farmer_layout.css";

// Importing farmer pages
import FarmerDashboard from "./farmer_dashboard";
import FarmerRecommendations from "./FarmerRecommendations";
import FarmerCropManagement from "./farmer_crop_management";
import FarmerRentalMarket from "./farmer_rental_market";
import FarmerMyEquipment from "./farmer_rental_my_equipment";
import FarmerOrders from "./farmer_orders";
import FarmerProfile from "./farmer_profile";
import FarmerSettings from "./farmer_settings";
import FarmerInventory from "./FarmerInventory";
import CommunityFeed from "../community/CommunityFeed";
import Consultation from "../user/Consultation";
import FarmerRentalBooking from "./farmer_rental_booking";
import FarmerMessages from "./farmer_messages";
import AlertsViewer from "../community/AlertsViewer";
import FieldManagement from "./FieldManagement";
import DisasterLogManagement from "./DisasterLogManagement";
import CalcDashboard from "./CalcDashboard";
import FarmerCropMarket from "./farmer_crop_market";
import AgricultureResources from "./AgricultureResources";

const FarmerLayout = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSync, setShowSync] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const acknowledgedCountRef = useRef(0);
  const hiddenIdsRef = useRef([]);
  const navigate = useNavigate();

  // --- SECURITY GATE: Check Approval Status ---
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const status = localStorage.getItem("userStatus");

    if (!role || role !== "farmer") {
      // If not a farmer, kick back to login
      navigate("/login");
    } else if (status === "pending") {
      // If pending, redirect to the approval notice page
      navigate("/pending-approval");
    }
  }, [navigate]);

  // Listen for external requests to open Messages view (from other components)
  useEffect(() => {
    const handler = () => setCurrentPage("messages");
    window.addEventListener('openMessages', handler);
    // If a direct open request is already set in localStorage, switch immediately
    if (localStorage.getItem('openChatWith')) setCurrentPage('messages');
    return () => window.removeEventListener('openMessages', handler);
  }, []);

  // Backend Ready: User State (Now pulled from localStorage)
  const [currentUser, setCurrentUser] = useState({
    name: localStorage.getItem("userName") || "Farmer",
    role: "Verified Farmer",
    notifications: 0,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem("userEmail") || 'Farmer'}`
  });

  const email = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");
  const farmerId = localStorage.getItem("farmerId");
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const SERVER_BASE = process.env.REACT_APP_BASE_URL || "http://localhost:5000";
  const getUrl = (ep) => API_BASE.includes("/api") ? `${API_BASE}${ep}` : `${API_BASE}/api${ep}`;

  const layoutQuery = useQuery({
    queryKey: ["farmerLayout", email, userId, farmerId, token],
    queryFn: async () => {
      let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'Farmer'}`;
      let name = localStorage.getItem("userName") || "Farmer";
      const notifs = [];

      if (!email || !token) {
        return { name, avatarUrl, notifications: [], badgeCount: 0 };
      }

      try {
        const profileRes = await fetch(getUrl(`/auth/profile?email=${email}`), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-cache",
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
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
        console.error("Profile fetch error in layout", err);
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
        } catch (e) {
          console.error("Msg fetch error", e?.message || e);
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

      return { name, avatarUrl, notifications: visibleNotifs, badgeCount };
    },
    enabled: !!userId && !!token,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 0,
    refetchInterval: false,
    refetchIntervalInBackground: false
  });

  useEffect(() => {
    if (!layoutQuery.data) return;
    setNotificationsList(layoutQuery.data.notifications);
    setCurrentUser(prev => ({ ...prev,
      name: layoutQuery.data.name,
      avatar: layoutQuery.data.avatarUrl,
      notifications: layoutQuery.data.badgeCount
    }));
  }, [layoutQuery.data]);

  // Auto-Update Notification Logic
  useEffect(() => {
    setShowSync(true);
    const timer = setTimeout(() => setShowSync(false), 2000);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, view: "dashboard" },
    { name: "Alerts", icon: <AlertTriangle size={18} />, view: "alerts" },
    { name: "Recommendations", icon: <Sprout size={18} />, view: "recommendations" },
    { name: "Crop Management", icon: <ClipboardList size={18} />, view: "management" },
    { name: "Crop Market", icon: <ShoppingCart size={18} />, view: "crop-market" },
    { name: "Field Management", icon: <MapPin size={18} />, view: "fieldManagement" },
    { name: "Disaster Log", icon: <AlertTriangle size={18} />, view: "disaster-log" },
    { name: "Inventory", icon: <Package size={18} />, view: "inventory" },
    { name: "Community Feed", icon: <LayoutGrid size={18} />, view: "feed" },
    { name: "Consultation", icon: <Award size={18} />, view: "consultation" },
    { name: "Equipment Market", icon: <Tractor size={18} />, view: "rental-market" },
    { name: "My Equipment", icon: <Tractor size={18} />, view: "my-equipment" },
    { name: "My Bookings", icon: <Tractor size={18} />, view: "my-bookings" },
    { name: "Messages", icon: <MessageSquare size={18} />, view: "messages" },
    { name: "Calculator", icon: <ClipboardList size={18} />, view: "calculator" },
    { name: "Resources", icon: <BookOpen size={18} />, view: "resources" },

    { name: "Orders", icon: <ShoppingCart size={18} />, view: "orders" },
    { name: "Profile", icon: <User size={18} />, view: "profile" },
    { name: "Settings", icon: <Settings size={18} />, view: "settings" },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <FarmerDashboard onNavigate={setCurrentPage} />;
      case "alerts": return <AlertsViewer />;
      case "recommendations": return <FarmerRecommendations />;
      case "management": return <FarmerCropManagement />;
      case "crop-market": return <FarmerCropMarket />;
      case "fieldManagement": return <FieldManagement />;
      case "disaster-log": return <DisasterLogManagement />;
      case "inventory": return <FarmerInventory />;
      case "feed": return <CommunityFeed userRole="farmer" />;
      case "consultation": return <Consultation userRole="farmer" />;
      case "rental-market": return <FarmerRentalMarket />;
      case "my-equipment": return <FarmerMyEquipment />;
      case "my-bookings": return <FarmerRentalBooking />;
      case "messages": return <FarmerMessages />;
      case "calculator": return <CalcDashboard />;
      case "resources": return <AgricultureResources />;
      case "orders": return <FarmerOrders />;
      case "profile": return <FarmerProfile />;
      case "settings": return <FarmerSettings />;
      default: return <FarmerDashboard />;
    }
  };

  const handleLogout = () => {
    if (window.confirm("Logout from Farmer Panel?")) {
      // Clear all local session data
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="farmer-layout">
      <aside className="farmer-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <Sprout size={24} className="text-green-500" />
            <span className="logo-text">CROP<span className="text-green-600">VECTOR</span></span>
          </div>
          <div className="panel-tag">FARMER</div>
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
          <span>Logout</span>
        </div>
      </aside>

      <main className="farmer-content">
        <header className="farmer-topbar">
          <div className="topbar-left">
            <h2>{menuItems.find(m => m.view === currentPage)?.name}</h2>
            {showSync && (
              <div className="sync-notify">
                <div className="sync-indicator"></div>
                Refreshing Farmer Data...
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

            <div className="user-pill" onClick={() => setCurrentPage("profile")} style={{ cursor: 'pointer' }}>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-status">{currentUser.role}</span>
              </div>
              <div className="user-avatar" style={{ border: '2px solid #10b981' }}>
                <img src={currentUser.avatar} alt="Avatar" />
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

export default FarmerLayout;