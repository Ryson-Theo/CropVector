import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, Settings, BarChart3, LogOut, X,
  Leaf, UserCheck, Bell, AlertTriangle, AlertCircle, Mail
} from 'lucide-react';

import './Admin_layout.css';

// Import view components
import DashboardView from './admin_dashboard.js';
import UserManagementView from './admin_user_management.js';
import ExpertVerificationView from './admin_expert_verification.js';
import ModerationDashboard from './ModerationDashboard.js';
import SystemSettingsView from './admin_system_settings.js';
import AdminReports from './admin_reports.js';
import AlertsViewer from '../community/AlertsViewer.js';
import AuditCrops from './audit_crops.js';
import DisasterInsights from './DisasterInsights';
import MarketplaceAdmin from './MarketplaceAdmin';
import AdminContacts from './AdminContacts';

let adminProfileContactsCache = null;
let adminProfileContactsPromise = null;
const ADMIN_CONTACTS_CACHE_KEY = 'admin_contacts_cache';
const ADMIN_CONTACTS_CACHE_TS_KEY = 'admin_contacts_cache_ts';
const ADMIN_CONTACTS_CACHE_TTL = 5 * 60 * 1000;

const getCachedAdminContacts = () => {
  try {
    const raw = localStorage.getItem(ADMIN_CONTACTS_CACHE_KEY);
    const ts = Number(localStorage.getItem(ADMIN_CONTACTS_CACHE_TS_KEY));
    if (!raw || !ts) return null;
    if (Date.now() - ts > ADMIN_CONTACTS_CACHE_TTL) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return null;
  }
};

const cacheAdminContacts = (contacts) => {
  try {
    localStorage.setItem(ADMIN_CONTACTS_CACHE_KEY, JSON.stringify(contacts));
    localStorage.setItem(ADMIN_CONTACTS_CACHE_TS_KEY, String(Date.now()));
  } catch (err) {
    console.error('Failed to cache admin contacts', err);
  }
};

const fetchAdminProfileAndContactsOnce = async () => {
  if (adminProfileContactsCache) return adminProfileContactsCache;
  if (adminProfileContactsPromise) return adminProfileContactsPromise;

  adminProfileContactsPromise = (async () => {
    const email = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const getUrl = (ep) => API_BASE.includes('/api') ? `${API_BASE}${ep}` : `${API_BASE}/api${ep}`;
    const SERVER_BASE = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

    let name = localStorage.getItem('userName') || 'S. Admin';
    let avatarUrl = localStorage.getItem('userAvatar') || `https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem('userEmail') || 'Admin'}`;
    let contacts = getCachedAdminContacts();

    if (!token) {
      throw new Error('missing auth token for admin profile fetch');
    }

    if (email && (!localStorage.getItem('userName') || !localStorage.getItem('userAvatar'))) {
      try {
        const res = await fetch(getUrl(`/auth/profile?email=${email}`), {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.fullName) {
            name = data.fullName;
            localStorage.setItem('userName', data.fullName);
          }
          if (data.profilePic) {
            const pic = data.profilePic.replace(/\\/g, '/');
            avatarUrl = pic.startsWith('http') ? pic : `${SERVER_BASE}/${pic}`;
            localStorage.setItem('userAvatar', avatarUrl);
          }
        }
      } catch (err) {
        console.error('Profile fetch error', err);
      }
    }

    if (!contacts) {
      try {
        const res = await fetch(getUrl('/auth/admin/contacts'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const contactsData = await res.json();
          contacts = Array.isArray(contactsData) ? contactsData : (contactsData.contacts || []);
          cacheAdminContacts(contacts);
        }
      } catch (err) {
        console.error('Contacts fetch error', err);
      }
    }

    const result = { name, avatarUrl, contacts: contacts || [] };
    adminProfileContactsCache = result;
    adminProfileContactsPromise = null;
    return result;
  })();

  return adminProfileContactsPromise;
};

const adminNavItems = [
  { path: 'dashboard', name: 'Dashboard', icon: BarChart3, view: 'dashboard' },
  { path: 'alerts', name: 'Broadcast Alerts', icon: AlertTriangle, view: 'alerts' },
  { path: 'reports', name: 'Issue Reports', icon: AlertCircle, view: 'reports' },
  { path: 'users', name: 'User Management', icon: Users, view: 'users' },
  { path: 'experts', name: 'Expert Verification', icon: UserCheck, view: 'experts' },
  { path: 'moderation', name: 'Content Moderation', icon: CheckCircle, view: 'moderation' },
  { path: 'marketplace', name: 'Marketplace', icon: Leaf, view: 'marketplace' },
  { path: 'crops', name: 'Crop Audit', icon: Leaf, view: 'crops' },
  { path: 'disasters', name: 'Disaster Insights', icon: AlertTriangle, view: 'disasters' },
  { path: 'contacts', name: 'Contacts', icon: Mail, view: 'contacts' },
  { path: 'settings', name: 'System Settings', icon: Settings, view: 'settings' },
];

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [refreshTick, setRefreshTick] = useState(0); 
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const acknowledgedCountRef = useRef(0);
  const hiddenIdsRef = useRef(JSON.parse(localStorage.getItem("admin_hidden_notifications") || "[]"));
  // Refs for tracking data changes to trigger notifications
  const prevCounts = useRef({ experts: 0, orders: 0 });

  // --- 1. SECURITY GATE ---
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  // --- 2. 60-SECOND REFRESH PULSE ---
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Firebase/UI states
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [_userId, setUserId] = useState(localStorage.getItem("firebaseUid") || null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [experts, setExperts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0, totalFarmers: 0, totalBuyers: 0, totalExperts: 0, totalAdmins: 0,
    pendingExperts: 0, totalOrdersValue: 0, unverifiedPosts: 0, pendingNotifications: 0,
  });

  const [currentUser, setCurrentUser] = useState({
    name: localStorage.getItem("userName") || 'S. Admin',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem("userEmail") || 'Admin'}`,
    notifications: 0
  });

  // --- 3. FIREBASE & NOTIFICATION LOGIC ---
  useEffect(() => {
    const firebaseConfig = typeof window.__firebase_config !== 'undefined'
      ? (typeof window.__firebase_config === 'string' ? JSON.parse(window.__firebase_config) : window.__firebase_config)
      : null;

    if (!firebaseConfig) {
      setIsAuthReady(true);
      return;
    }

    const initFirebase = async () => {
      try {
        const { initializeApp } = await import('firebase/app');
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const { getFirestore, collection, onSnapshot } = await import('firebase/firestore');

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authInstance = getAuth(app);

        setDb(firestore);
        setAuth(authInstance);

        onAuthStateChanged(authInstance, (user) => {
          setUserId(user?.uid || localStorage.getItem("firebaseUid"));
          setIsAuthReady(true);
        });

        const appId = window.__app_id || 'default';
        
        // Notification Listener for Experts
        onSnapshot(collection(firestore, `artifacts/${appId}/public/data/expert_approvals`), (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const pendingCount = data.filter(e => e.status === 'Pending').length;
          
          if (prevCounts.current.experts !== 0 && pendingCount > prevCounts.current.experts) {
            setStats(prev => ({ ...prev, pendingNotifications: prev.pendingNotifications + 1 }));
          }
          prevCounts.current.experts = pendingCount;
          setExperts(data);
        });

      } catch (err) {
        console.error("Auth initialization failed:", err);
        setIsAuthReady(true);
      }
    };
    initFirebase();
  }, []);

  // --- 4. FETCH PROFILE & CONTACTS ONCE ---
  useEffect(() => {
    const fetchProfileAndContacts = async () => {
      try {
        const data = await fetchAdminProfileAndContactsOnce();
        setContacts(data.contacts);
        setCurrentUser(prev => ({ ...prev, name: data.name, avatar: data.avatarUrl }));
      } catch (err) {
        console.error('Admin profile/contacts init failed', err);
        const cachedContacts = getCachedAdminContacts();
        if (cachedContacts) {
          setContacts(cachedContacts);
        }
      }
    };

    fetchProfileAndContacts();
    const contactsInterval = setInterval(() => {
      fetchProfileAndContacts();
    }, 5 * 60 * 1000);

    return () => clearInterval(contactsInterval);
  }, [navigate]);

  useEffect(() => {
    const notifications = [];

    experts.filter(e => e.status === 'Pending').forEach(e => {
      notifications.push({ id: e.id, text: `Verification: ${e.fullName || 'User'}`, view: 'experts', time: 'Pending' });
    });

    contacts.filter(c => c.status === 'new').forEach(c => {
      notifications.push({
        id: c._id,
        text: `New Message: ${c.subject}`,
        view: 'contacts',
        time: new Date(c.createdAt).toLocaleDateString()
      });
    });

    const visibleNotifs = notifications.filter(n => !hiddenIdsRef.current.includes(n.id));
    const currentCount = visibleNotifs.length;
    let ackCount = acknowledgedCountRef.current;

    if (currentCount < ackCount) {
      ackCount = currentCount;
      acknowledgedCountRef.current = ackCount;
    }

    const badgeCount = Math.max(0, currentCount - ackCount);

    setNotificationsList(visibleNotifs);
    setCurrentUser(prev => ({ ...prev, notifications: badgeCount }));
  }, [experts, contacts]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const renderCurrentView = () => {
    if (!isAuthReady) return <div className="empty-state">Initializing Dashboard...</div>;
    const viewProps = { stats, db, auth, experts, refreshTick, setStats, setCurrentPage };

    switch (currentPage) {
      case 'dashboard': return <DashboardView {...viewProps} />;
      case 'alerts': return <AlertsViewer />;
      case 'reports': return <AdminReports />;
      case 'users': return <UserManagementView {...viewProps} />;
      case 'experts': return <ExpertVerificationView {...viewProps} />;
      case 'moderation': return <ModerationDashboard {...viewProps} />;
      case 'marketplace': return <MarketplaceAdmin />;
      case 'crops': return <AuditCrops {...viewProps} />;
      case 'disasters': return <DisasterInsights />;
      case 'contacts': return <AdminContacts />;
      case 'settings': return <SystemSettingsView {...viewProps} />;
      default: return <DashboardView {...viewProps} />;
    }
  };

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* --- SIDEBAR --- */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Leaf size={28} style={{ color: 'var(--cv-green-light)' }} />
          <span className="sidebar-logo">CropVector</span>
          <button className="sidebar-toggle-btn desktop-hide" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} color="#fff" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {adminNavItems.map((item) => (
              <li key={item.path}>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setCurrentPage(item.view); }}
                  className={currentPage === item.view ? 'active' : ''}
                >
                  <item.icon className="nav-icon" />
                  <span className="nav-text">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="header-left">
            <h1 className="header-title">
              Admin | {adminNavItems.find(i => i.view === currentPage)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="header-right-controls">
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
                        <div key={i} onClick={() => { 
                             if (!hiddenIdsRef.current.includes(n.id)) {
                               hiddenIdsRef.current.push(n.id);
                               localStorage.setItem("admin_hidden_notifications", JSON.stringify(hiddenIdsRef.current));
                             }
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

            <div className="profile-link" onClick={() => setCurrentPage('settings')}>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">Administrator</span>
               
              </div>
              <div className="user-avatar" style={{ overflow: 'hidden' }}>
                <img src={currentUser.avatar} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content-outlet">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;