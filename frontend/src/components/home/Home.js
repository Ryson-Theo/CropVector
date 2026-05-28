import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Home.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

// Import Lucide React icons
import { 
  Leaf, Shield, Cpu, Globe, Zap, BarChart3, Clock, CheckCircle,
  Cloud, Droplets, TrendingUp, Users, Smartphone, Database,
  Phone, Mail, MapPin, Twitter, Facebook, Linkedin, Instagram,
  ArrowRight, Sprout, Thermometer, Package, ShoppingCart,
  DollarSign, Calendar,
  TrendingDown, ChevronUp, ChevronDown, Filter, MoreVertical,
  Target, Crop, Droplet, Sun, Moon, Wind, ThermometerSun,
  Brain, Globe2, ShieldCheck, Activity
} from 'lucide-react';

// Custom Icon component
const Icon = ({ name, className = "", size = 20, ...props }) => {
  const icons = {
    leaf: <Leaf className={className} size={size} {...props} />,
    shield: <Shield className={className} size={size} {...props} />,
    cpu: <Cpu className={className} size={size} {...props} />,
    globe: <Globe className={className} size={size} {...props} />,
    zap: <Zap className={className} size={size} {...props} />,
    chart: <BarChart3 className={className} size={size} {...props} />,
    clock: <Clock className={className} size={size} {...props} />,
    check: <CheckCircle className={className} size={size} {...props} />,
    cloud: <Cloud className={className} size={size} {...props} />,
    droplets: <Droplets className={className} size={size} {...props} />,
    trending: <TrendingUp className={className} size={size} {...props} />,
    users: <Users className={className} size={size} {...props} />,
    phone: <Smartphone className={className} size={size} {...props} />,
    database: <Database className={className} size={size} {...props} />,
    call: <Phone className={className} size={size} {...props} />,
    mail: <Mail className={className} size={size} {...props} />,
    map: <MapPin className={className} size={size} {...props} />,
    twitter: <Twitter className={className} size={size} {...props} />,
    facebook: <Facebook className={className} size={size} {...props} />,
    linkedin: <Linkedin className={className} size={size} {...props} />,
    instagram: <Instagram className={className} size={size} {...props} />,
    arrow: <ArrowRight className={className} size={size} {...props} />,
    sprout: <Sprout className={className} size={size} {...props} />,
    thermometer: <Thermometer className={className} size={size} {...props} />,
    package: <Package className={className} size={size} {...props} />,
    cart: <ShoppingCart className={className} size={size} {...props} />,

    dollar: <DollarSign className={className} size={size} {...props} />,
    calendar: <Calendar className={className} size={size} {...props} />,
    trendingdown: <TrendingDown className={className} size={size} {...props} />,
    chevronup: <ChevronUp className={className} size={size} {...props} />,
    chevrondown: <ChevronDown className={className} size={size} {...props} />,
    filter: <Filter className={className} size={size} {...props} />,
    more: <MoreVertical className={className} size={size} {...props} />,
    target: <Target className={className} size={size} {...props} />,
    crop: <Crop className={className} size={size} {...props} />,
    droplet: <Droplet className={className} size={size} {...props} />,
    sun: <Sun className={className} size={size} {...props} />,
    wind: <Wind className={className} size={size} {...props} />,
    thermometersun: <ThermometerSun className={className} size={size} {...props} />,
    brain: <Brain className={className} size={size} {...props} />,
    globe2: <Globe2 className={className} size={size} {...props} />,
    shieldcheck: <ShieldCheck className={className} size={size} {...props} />,
    activity: <Activity className={className} size={size} {...props} />
    ,
    moon: <Moon className={className} size={size} {...props} />
  };
  
  return icons[name] || null;
};

// Modern Bar Chart Component
const ModernBarChart = ({ title, data, currentValue, previousValue }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="chart-card modern-card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-value">${currentValue.toLocaleString()}</div>
      </div>
      
      <div className="chart-container">
        <div className="chart-bar">
          {data.map((item, index) => (
            <div key={index} className="chart-bar-item">
              <div className="chart-bar-value">${item.value.toLocaleString()}</div>
              <div 
                className="chart-bar-fill"
                style={{ 
                  height: `${(item.value / maxValue) * 100}%`,
                  animationDelay: `${index * 100}ms`
                }}
              ></div>
              <div className="chart-bar-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {previousValue && (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-light">
          <div className="text-muted small">Last period: ${previousValue.toLocaleString()}</div>
          <div className={`d-flex align-items-center gap-1 ${currentValue > previousValue ? 'text-success' : 'text-danger'}`}>
            {currentValue > previousValue ? (
              <>
                <Icon name="chevronup" size={14} />
                <span>{((currentValue - previousValue) / previousValue * 100).toFixed(1)}%</span>
              </>
            ) : (
              <>
                <Icon name="chevrondown" size={14} />
                <span>{((previousValue - currentValue) / previousValue * 100).toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Income Card Component
const IncomeCard = ({ current, previous, title = "Revenue" }) => {
  const change = ((current - previous) / previous * 100).toFixed(1);
  const isPositive = current > previous;
  
  return (
    <div className="income-card modern-card">
      <div className="income-header">
        <div>
          <div className="text-muted small mb-1">{title}</div>
          <div className="income-value">${current.toLocaleString()}</div>
        </div>
        <div className={`income-change d-flex align-items-center gap-1 ${isPositive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
          {isPositive ? <Icon name="chevronup" size={14} /> : <Icon name="chevrondown" size={14} />}
          <span>{change}%</span>
        </div>
      </div>
      <div className="text-muted small">Last period: ${previous.toLocaleString()}</div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ title, items }) => {
  return (
    <div className="category-card modern-card">
      <h5 className="mb-3">{title}</h5>
      <div className="category-list">
        {items.map((item, index) => (
          <div key={index} className="category-item">
            <div className="category-name">{item.name}</div>
            <div className="category-count">{item.count} {item.unit || 'transactions'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModuleCard = ({ title, desc, img, delay = 0, icon }) => (
  <div className="col-lg-3 col-md-6">
    <div className="module-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="module-art position-relative">
        <img src={img} alt={title} className="module-img" />
        <div className="module-icon-wrapper position-absolute top-0 start-0 m-3 rounded-circle p-2 shadow-sm">
          {icon}
        </div>
      </div>
      <h5 className="mt-3 mb-2 fw-semibold">{title}</h5>
      <p className="small text-muted mb-0">{desc}</p>
    </div>
  </div>
);

export default function Home() {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cv_dark_mode");
    if (saved === "1") setDark(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("cv-dark", dark);
    localStorage.setItem("cv_dark_mode", dark ? "1" : "0");
  }, [dark]);

  // Data for modern charts
  const expensesData = [
    { label: 'Jan', value: 12543 },
    { label: 'Feb', value: 14200 },
    { label: 'Mar', value: 13800 },
    { label: 'Apr', value: 16200 },
    { label: 'May', value: 18900 },
    { label: 'Jun', value: 21543 }
  ];

  const yieldData = [
    { label: 'Corn', value: 45000 },
    { label: 'Wheat', value: 32000 },
    { label: 'Rice', value: 28000 },
    { label: 'Soy', value: 19000 },
    { label: 'Cotton', value: 15000 }
  ];

  const categoryData = [
    { name: 'Groceries', count: 9, unit: 'transactions' },
    { name: 'Equipment', count: 5, unit: 'transactions' },
    { name: 'Seeds', count: 12, unit: 'transactions' },
    { name: 'Fertilizer', count: 7, unit: 'transactions' },
    { name: 'Labor', count: 15, unit: 'transactions' }
  ];

  const stats = [
    { value: "95%", label: "Client Satisfaction", icon: <Icon name="check" className="text-success" /> },
    { value: "100+", label: "Partner Farmers", icon: <Icon name="users" className="text-success" /> },
    { value: "400+", label: "Enterprise Clients", icon: <Icon name="trending" className="text-success" /> },
    { value: "99.9%", label: "Data Reliability", icon: <Icon name="database" className="text-success" /> },
  ];

  const modules = [
    {
      title: "Weather Intelligence",
      desc: "Hyperlocal forecasts, micro-climate analysis and risk alerts.",
      img: "https://images.unsplash.com/photo-1707398238936-24a06fc1f101?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      icon: <Icon name="cloud" size={20} className="text-success" />
    },
    {
      title: "Soil & Crop Analytics",
      desc: "Dual-input soil profiler (lab + visual) with nutrient scoring.",
      img: "https://images.unsplash.com/photo-1754106005357-2095d15fb965?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      icon: <Icon name="droplet" size={20} className="text-success" />
    },
    {
      title: "Market Price Engine",
      desc: "Real-time pricing, demand heatmaps and buyer insights.",
      img: "https://images.unsplash.com/photo-1559454473-5956d83259ca?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      icon: <Icon name="trending" size={20} className="text-success" />
    },
    {
      title: "Farm Operations",
      desc: "Task scheduling, workforce management and traceable logs.",
      img: "https://images.unsplash.com/photo-1759302081336-f79d96ecf83f?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      icon: <Icon name="activity" size={20} className="text-success" />
    }
  ];

  const features = [
    { icon: "shieldcheck", title: "Secure & Compliant", desc: "Enterprise-grade security and role-based access." },
    { icon: "brain", title: "Smart Crop Recommendations", desc: "Rule-based system providing crop suitability and yield insights." },
    { icon: "chart", title: "Actionable Insights", desc: "Clear KPIs and exportable reports for decisions." },
    { icon: "globe2", title: "Regional Data", desc: "Integrated regional datasets & satellite feeds." },
    { icon: "zap", title: "Fast Onboarding", desc: "Quick setup, offline-first mobile support." },
    { icon: "target", title: "Real-Time Alerts", desc: "Push & SMS alerts for crucial farm events." },
  ];

  const testimonials = [
    {
      quote: "CropVector transformed our field planning — yield quality and scheduling became predictable.",
      who: "R. Menon, Farm Operations Lead"
    },
    {
      quote: "The marketplace integration saved us time and improved price realization for bulk produce.",
      who: "S. Patel, Aggregator"
    },
    {
      quote: "Expert advisory + soil scanner gave us the confidence to scale organically.",
      who: "L. Fernandes, Organic Farmer"
    }
  ];

  return (
    <div className="home-root">
      {/* NAVBAR */}
      <nav className={`navbar navbar-expand-lg fixed-top custom-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a className="navbar-brand fw-bold text-brand" href="/">
            <Icon name="leaf" size={24} />
            CropVector
          </a>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><a className="nav-link" href="#hero">Home</a></li>
              <li className="nav-item"><a className="nav-link" href="#analytics">Analytics</a></li>
              <li className="nav-item"><a className="nav-link" href="#modules">Solutions</a></li>
              <li className="nav-item"><a className="nav-link" href="#products">Products</a></li>
              <li className="nav-item"><a className="nav-link" href="#dashboard">Dashboard</a></li>
              <li className="nav-item"><a className="nav-link" href="#faq">FAQ</a></li>
              <li className="nav-item ms-3">
                <button className="btn btn-ghost me-2" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
                  {dark ? <Icon name="sun" size={18} /> : <Icon name="moon" size={18} />}
                </button>
              </li>
              <li className="nav-item">
                <Link className="btn btn-outline-secondary me-2" to="/login">Log In</Link>
              </li>
              <li className="nav-item">
                <Link className="btn btn-primary" to="/register">Get Started</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* HERO */}
<section 
  id="hero"
  className="polaris-hero"
  style={{
    backgroundImage: `url('https://images.unsplash.com/photo-1593463897552-69da7e8343eb?q=80&w=1170&auto=format&fit=crop')`,
  }}
>

  {/* Gradient Overlays */}
  <div className="polaris-hero-gradient"></div>
  <div className="polaris-hero-fade"></div>

  <div className="container polaris-hero-wrapper">

    {/* LEFT CONTENT */}
    <div className="polaris-left">
      <h1 className="polaris-title">CropVector</h1>
      <p className="polaris-subtitle">Grow Smarter, Farm Better</p>

      <p className="polaris-desc">
        Combine soil analytics, weather intelligence, farm ops and a direct marketplace.
        Plan better, reduce risk, and get measurable uplift in yield and margins.
      </p>

      <p className="polaris-footnote">
        Discovery doesn't begin with knowing — it begins with questions.
      </p>
    </div>

    {/* RIGHT GLASS PANEL */}
    <div className="polaris-right">
      <div className="polaris-glass">
        <Link className="polaris-btn" to="/register">
          Start Exploring
        </Link>

        <p className="polaris-glass-text">
          Smart farming insights with live weather, soil guidance, and real-time market prices.
        </p>

        <p className="polaris-glass-text">
          We bring together real-time weather, soil insights, and market data from trusted sources to guide smarter crop decisions.
        </p>
      </div>
    </div>

  </div>
</section>


      {/* KPIs */}
      <section id="kpis" className="section section-kpis">
        <div className="container">
          <div className="row g-4">
            {stats.map((s, i) => (
              <div key={i} className="col-md-3">
                <div className="kpi-card" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                    {s.icon}
                  </div>
                  <div className="kpi-value">{s.value}</div>
                  <div className="kpi-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODERN ANALYTICS DASHBOARD */}
      <section id="analytics" className="section">
        <div className="container">
          <h2 className="section-title">Track Your Farm Performance</h2>
          <p className="section-subtitle">Monitor expenses, revenue, and crop yields with interactive analytics</p>
          
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="chart-card modern-card">
                <div className="chart-header">
                  <h3 className="chart-title">Farm Expenses Trend</h3>
                  <div className="chart-value">$21,543</div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expensesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" />
                    <XAxis dataKey="label" stroke="var(--cv-muted)" />
                    <YAxis stroke="var(--cv-muted)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)', borderRadius: '8px' }}
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="value" fill="var(--cv-green)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-light">
                  <div className="text-muted small">Last period: $15,989</div>
                  <div className="d-flex align-items-center gap-1 text-success">
                    <Icon name="chevronup" size={14} />
                    <span>34.8%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="d-flex flex-column gap-4">
                <div className="income-card modern-card">
                  <div className="income-header">
                    <div>
                      <div className="text-muted small mb-1">Monthly Revenue</div>
                      <div className="income-value">$15,989</div>
                    </div>
                    <div className="income-change d-flex align-items-center gap-1">
                      <Icon name="chevronup" size={14} />
                      <span>7.5%</span>
                    </div>
                  </div>
                  <div className="text-muted small">Last period: $14,871</div>
                </div>
                
                <div className="category-card modern-card">
                  <h5 className="mb-3">Expense Categories</h5>
                  <div className="category-list">
                    {categoryData.map((item, index) => (
                      <div key={index} className="category-item">
                        <div className="category-name">{item.name}</div>
                        <div className="category-count">{item.count} {item.unit || 'transactions'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row mt-4">
            <div className="col-lg-6">
              <div className="chart-card modern-card">
                <div className="chart-header">
                  <h3 className="chart-title">Crop Yield Comparison</h3>
                  <div className="chart-value">45,000</div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yieldData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" />
                    <XAxis dataKey="label" stroke="var(--cv-muted)" />
                    <YAxis stroke="var(--cv-muted)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)', borderRadius: '8px' }}
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="value" fill="var(--cv-green)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-light">
                  <div className="text-muted small">Last period: $38,000</div>
                  <div className="d-flex align-items-center gap-1 text-success">
                    <Icon name="chevronup" size={14} />
                    <span>18.4%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="modern-card h-100 d-flex flex-column justify-content-center">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-success-soft p-3 rounded-circle">
                    <Icon name="target" size={24} className="text-success" />
                  </div>
                  <div>
                    <h4 className="mb-1">Gain Control</h4>
                    <p className="text-muted mb-0">Monitor all farm activities in one place</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Soil Health</div>
                      <div className="fw-bold">Excellent</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Water Usage</div>
                      <div className="fw-bold">Optimal</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Crop Health</div>
                      <div className="fw-bold">Good</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Profit Margin</div>
                      <div className="fw-bold text-success">+24.5%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section id="why" className="section section-why">
        <div className="container">
          <div className="row align-items-center gx-5">
            <div className="col-lg-6">
              <h2 className="section-title">Comprehensive Agricultural Solutions</h2>
              <p className="section-subtitle mb-4">Tools engineered for commercial farming, cooperatives and agribusinesses.</p>

              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <div className="modern-card accent">
                    <div className="tile-heading">25 Years</div>
                    <div className="tile-sub text-muted">Combined agri expertise</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="modern-card">
                    <div className="tile-heading">100%</div>
                    <div className="tile-sub text-muted">Natural & traceable produce</div>
                  </div>
                </div>
              </div>

              <div className="modern-card p-4">
                <h6 className="mb-3 fw-semibold">Explore Farm Solutions</h6>
                <ul className="list-unstyled text-muted mb-0">
                  <li className="mb-2 d-flex align-items-center gap-2">
                    <Icon name="check" size={16} className="text-success" />
                    Seeds & seedlings — region matched
                  </li>
                  <li className="mb-2 d-flex align-items-center gap-2">
                    <Icon name="check" size={16} className="text-success" />
                    Soil enhancers & organic inputs
                  </li>
                  <li className="mb-2 d-flex align-items-center gap-2">
                    <Icon name="check" size={16} className="text-success" />
                    Crop protection & IPM
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <Icon name="check" size={16} className="text-success" />
                    Market access & pricing tools
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-12">
                  <div className="modern-card p-0 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1634433545797-c18dd170e75e?q=80&w=1333&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                      alt="field" 
                      className="img-fluid w-100"
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="modern-card p-0 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                      alt="farmer"
                      className="img-fluid w-100"
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="modern-card h-100 p-3 d-flex flex-column justify-content-center">
                    <h6 className="mb-1">Top Agriculture & Organic Enterprises</h6>
                    <p className="small text-muted mb-0">Trusted by cooperatives, aggregators and agribusinesses.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="section section-modules">
        <div className="container">
          <h2 className="section-title text-center">Core Platform Modules</h2>
          <p className="section-subtitle text-center">Enterprise-ready solutions for modern agriculture</p>

          <div className="row g-4">
            {modules.map((m, i) => (
              <div key={i} className="col-lg-6 col-md-6">
                <div className="module-card" style={{ animationDelay: `${i * 80}ms`, minHeight: '380px' }}>
                  <div className="module-art position-relative">
                    <img src={m.img} alt={m.title} className="module-img" style={{ height: '220px' }} />
                    <div className="position-absolute top-0 start-0 m-3 bg-white rounded-circle p-2 shadow-sm">
                      {m.icon}
                    </div>
                  </div>
                  <h5 className="mt-3 mb-2 fw-semibold">{m.title}</h5>
                  <p className="small text-muted mb-0">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="section">
        <div className="container">
          <h2 className="section-title text-center">How CropVector Works</h2>
          <p className="section-subtitle text-center">Simple steps from field data to market success</p>

          <div className="row g-4 align-items-stretch mb-5">
            <div className="col-md-3">
              <div className="work-step h-100 d-flex flex-column">
                <div className="step-icon mb-3">{Icon({ name: "cpu", size: 26 })}</div>
                <h6 className="mt-2 mb-2">Collect Data</h6>
                <p className="small text-muted flex-grow-1">Comprehensive soil tests, satellite imagery, weather data and real-time farmer inputs from your fields.</p>
                <div className="text-success small fw-semibold mt-3"> Lab & Visual Analysis</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="work-step h-100 d-flex flex-column">
                <div className="step-icon mb-3">{Icon({ name: "brain", size: 26 })}</div>
                <h6 className="mt-2 mb-2">Analyze & Predict</h6>
                <p className="small text-muted flex-grow-1">Rule-based models generate crop recommendations, expected yields, and optimized field management strategies.</p>
                <div className="text-success small fw-semibold mt-3"> Rule-Based Insights</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="work-step h-100 d-flex flex-column">
                <div className="step-icon mb-3">{Icon({ name: "zap", size: 26 })}</div>
                <h6 className="mt-2 mb-2">Execute & Monitor</h6>
                <p className="small text-muted flex-grow-1">Real-time field actions, smart alerts for weather/diseases, task scheduling, and traceable activity logs.</p>
                <div className="text-success small fw-semibold mt-3"> Real-Time Alerts</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="work-step h-100 d-flex flex-column">
                <div className="step-icon mb-3">{Icon({ name: "trending", size: 26 })}</div>
                <h6 className="mt-2 mb-2">Sell & Optimize</h6>
                <p className="small text-muted flex-grow-1">Direct marketplace access, buyer matching, transparent pricing, and digital contracts for maximum profitability.</p>
                <div className="text-success small fw-semibold mt-3"> Fair Market Rates</div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="modern-card p-5 bg-success-soft">
                <h5 className="mb-3 text-success">Why This Approach?</h5>
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="d-flex gap-3">
                      <Icon name="check" size={24} className="text-success flex-shrink-0 mt-1" />
                      <div>
                        <h6 className="mb-1">Data-Driven Decisions</h6>
                        <p className="small text-muted mb-0"> Reduce guesswork with crop suggestions and field insights derived from actual data.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex gap-3">
                      <Icon name="check" size={24} className="text-success flex-shrink-0 mt-1" />
                      <div>
                        <h6 className="mb-1">Risk Mitigation</h6>
                        <p className="small text-muted mb-0">Smart alerts and forecasts help prevent crop losses from weather and diseases.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex gap-3">
                      <Icon name="check" size={24} className="text-success flex-shrink-0 mt-1" />
                      <div>
                        <h6 className="mb-1">Market Access</h6>
                        <p className="small text-muted mb-0">Connect directly with buyers and eliminate intermediaries for better margins.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="dashboard" className="section section-dashboard">
        <div className="container">
          <div className="row align-items-center gx-5">
            <div className="col-lg-7">
              <div className="modern-card flat p-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=1106&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="dashboard mock" className="img-fluid"/>
              </div>
            </div>
            <div className="col-lg-5">
              <h3 className="section-title mb-3">Smart Dashboard</h3>
              <p className="text-muted mb-4">Monitor everything from soil health to market prices in one unified interface.</p>
              <ul className="list-unstyled text-muted mb-4">
                <li className="mb-3 d-flex align-items-start gap-2">
                  <Icon name="check" size={18} className="text-success mt-1" />
                  <span><strong>Live weather widgets:</strong> Local conditions per-field</span>
                </li>
                <li className="mb-3 d-flex align-items-start gap-2">
                  <Icon name="check" size={18} className="text-success mt-1" />
                  <span><strong>Soil & moisture insights:</strong> Schedule irrigation with confidence</span>
                </li>
                <li className="mb-3 d-flex align-items-start gap-2">
                  <Icon name="check" size={18} className="text-success mt-1" />
                  <span><strong>Crop performance:</strong> Timeline from sowing to harvest</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Icon name="check" size={18} className="text-success mt-1" />
                  <span><strong>Market exposure:</strong> Receive buyer offers and manage orders</span>
                </li>
              </ul>
              <Link to="/register" className="btn btn-primary d-inline-flex align-items-center gap-2">
                Try Dashboard
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="section section-about">
        <div className="container">
          <h2 className="section-title text-center mb-5">About CropVector</h2>
          
          <div className="row align-items-center g-5 mb-5">
            <div className="col-lg-6">
              <div className="modern-card overflow-hidden shadow-lg" style={{ height: '420px', borderRadius: '20px' }}>
                <div className="tenor-gif-embed" data-postid="5336028" data-share-method="host" data-aspect-ratio="1.78571" data-width="100%" style={{ height: '100%' }}>
                  <a href="https://tenor.com/view/farm-farmer-farming-farmland-gif-5336028">Farm GIF</a>from <a href="https://tenor.com/search/farm-gifs">Farm GIFs</a>
                </div>
                <script type="text/javascript" async src="https://tenor.com/embed.js"></script>
              </div>
            </div>
            <div className="col-lg-6">
              <h3 className="mb-4" style={{ color: 'var(--cv-green)', fontSize: '2rem', fontWeight: '700' }}>Our Mission & Vision</h3>
              <p className="mb-3 lead">CropVector is an integrated agritech platform designed to drive efficiency and profitability across the agricultural lifecycle. Our core mission is to replace traditional farming guesswork with data-driven decision support.</p>
              
              <p className="mb-3">We eliminate market friction by establishing a direct commercial bridge between producers and buyers. The system is modular, focusing on intelligent analysis, knowledge validation, and transaction management.</p>
              
              <p className="mb-4">We serve five distinct user categories: Farmers seeking recommendations, Buyers looking for local sourcing, Experts validating content, General users sharing knowledge, and Admins managing the platform.</p>
              
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="modern-card p-4 text-center">
                    <div className="tile-heading" style={{ fontSize: '2.2rem' }}>100+</div>
                    <div className="tile-sub">Partner Farmers</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="modern-card p-4 text-center">
                    <div className="tile-heading" style={{ fontSize: '2.2rem' }}>400+</div>
                    <div className="tile-sub">Enterprise Clients</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="modern-card p-4 text-center">
                    <div className="tile-heading" style={{ fontSize: '2.2rem' }}>95%</div>
                    <div className="tile-sub">Satisfaction Rate</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="modern-card p-4 text-center">
                    <div className="tile-heading" style={{ fontSize: '2.2rem' }}>99.9%</div>
                    <div className="tile-sub">Data Reliability</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-3">
            <div className="col-md-4">
              <div className="modern-card p-4 text-center h-100 shadow-sm">
                <Icon name="shieldcheck" size={40} className="text-success mb-3" />
                <h5 className="mb-3 fw-bold">Secure & Compliant</h5>
                <p className="small text-muted mb-0">Enterprise-grade security with role-based access control, encrypted data storage, and regular security audits.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="modern-card p-4 text-center h-100 shadow-sm">
                <Icon name="brain" size={40} className="text-success mb-3" />
                <h5 className="mb-3 fw-bold">Crop Planning Tools</h5>
                <p className="small text-muted mb-0">Offers crop recommendations, profitability insights, and practical field management guidance.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="modern-card p-4 text-center h-100 shadow-sm">
                <Icon name="chart" size={40} className="text-success mb-3" />
                <h5 className="mb-3 fw-bold">Actionable Insights</h5>
                <p className="small text-muted mb-0">Clear KPIs, exportable reports, and visual dashboards for confident, data-driven agricultural decisions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section section-faq">
        <div className="container">
          <h2 className="section-title text-center mb-5">Frequently Asked Questions</h2>
          
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="accordion accordion-flush" id="faqAccordion">
                <div className="accordion-item modern-card mb-3" style={{ border: 'none' }}>
                  <h2 className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1" aria-expanded="false" aria-controls="faq1">
                      <Icon name="chevrondown" size={18} className="me-2" />
                      What is CropVector?
                    </button>
                  </h2>
                  <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      CropVector is an integrated agritech platform that combines soil analytics, weather intelligence, farm operations management, and a direct marketplace. It helps farmers make data-driven decisions, reduce risk, and achieve measurable uplift in yield and profit margins.
                    </div>
                  </div>
                </div>

                <div className="accordion-item modern-card mb-3" style={{ border: 'none' }}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2" aria-expanded="false" aria-controls="faq2">
                      <Icon name="chevrondown" size={18} className="me-2" />
                      How does the Farmer Module work?
                    </button>
                  </h2>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      The Farmer Module provides smart soil & land analysis using a dual input system (lab data + visual Q&A), real-time location & climate integration, crop recommendations based on land size, profitability checks, lifecycle tracking, smart alerts for weather and diseases, and an expense manager for profit/loss calculations.
                    </div>
                  </div>
                </div>

                <div className="accordion-item modern-card mb-3" style={{ border: 'none' }}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3" aria-expanded="false" aria-controls="faq3">
                      <Icon name="chevrondown" size={18} className="me-2" />
                      Can buyers find local crops on CropVector?
                    </button>
                  </h2>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes! The Buyer Module enables wholesalers, restaurants, and retailers to search for specific crops within a defined radius. Farmers' profiles display crop history and buyer ratings, and buyers can create digital contracts with automatic bill/invoice PDF generation.
                    </div>
                  </div>
                </div>

                <div className="accordion-item modern-card mb-3" style={{ border: 'none' }}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4" aria-expanded="false" aria-controls="faq4">
                      <Icon name="chevrondown" size={18} className="me-2" />
                      What is the Expert Module?
                    </button>
                  </h2>
                  <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      The Expert Module is for verified agronomists and scientists. They validate high-quality community posts (granting "Green Badge" status), publish region-specific alerts, and provide professional advisory services. Expert onboarding requires credential submission and admin approval.
                    </div>
                  </div>
                </div>

                <div className="accordion-item modern-card mb-3" style={{ border: 'none' }}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq5" aria-expanded="false" aria-controls="faq5">
                      <Icon name="chevrondown" size={18} className="me-2" />
                      How does community knowledge sharing work?
                    </button>
                  </h2>
                  <div id="faq5" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      The Community Module fosters peer-to-peer learning through DIY & experience sharing posts. The feed is personalized with smart contextual suggestions (e.g., #Tomato tags for your crops). Expert-verified content receives a distinct "Green Badge" for authenticity assurance.
                    </div>
                  </div>
                </div>

                <div className="accordion-item modern-card mb-3" style={{ border: 'none' }}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq6" aria-expanded="false" aria-controls="faq6">
                      <Icon name="chevrondown" size={18} className="me-2" />
                      What support options are available?
                    </button>
                  </h2>
                  <div id="faq6" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      We offer comprehensive support including real-time weather widgets, soil & moisture insights for irrigation scheduling, crop performance timelines, market exposure with buyer offers, and order management. Our 24/7 support team is ready to assist via multiple channels.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-testimonials">
        <div className="container">
          <h2 className="section-title text-center mb-4">What Professionals Say</h2>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div className="col-md-4" key={i}>
                <div className="testimonial">
                  <div className="mb-3">
                    <Icon name="check" className="text-success" size={24} />
                  </div>
                  <p className="mb-3">"{t.quote}"</p>
                  <div className="fw-semibold">{t.who}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="row gy-5">
            <div className="col-lg-4">
              <div className="footer-brand d-flex align-items-center gap-2 mb-3">
                <Icon name="leaf" size={28} />
                <span>CropVector</span>
              </div>
              <p className="text-muted mb-4">Enterprise agriculture management platform for smarter decisions and fair markets.</p>
              <div className="social-links">
                <a href="https://x.com/Ryson_Theo" className="social-icon">
                  <Icon name="twitter" size={18} />
                </a>
                <a href="" className="social-icon" onClick={(e) => e.preventDefault()}>
                  <Icon name="facebook" size={18} />
                </a>
                <a href="https://www.linkedin.com/in/ribin-k-roy/" className="social-icon">
                  <Icon name="linkedin" size={18} />
                </a>
                <a href="https://www.instagram.com/ryson_theo/" className="social-icon">
                  <Icon name="instagram" size={18} />
                </a>
              </div>
            </div>

            <div className="col-lg-2 col-md-4">
              <div className="footer-links">
                <h6>Product</h6>
                <ul>
                  <li><a href="#analytics">Analytics</a></li>
                  <li><a href="#modules">Solutions</a></li>
                  <li><Link to="/products">Products</Link></li>
                  <li><a href="#dashboard">Dashboard</a></li>
                  <li><Link to="/pricing">Pricing</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-4">
              <div className="footer-links">
                <h6>Company</h6>
                <ul>
                  <li><a href="#about">About Us</a></li>
                  <li><Link to="/careers">Careers</Link></li>
                  <li><Link to="/blog">Blog</Link></li>
                  <li><Link to="/press">Press</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2 col-md-4">
              <div className="footer-links">
                <h6>Resources</h6>
                <ul>
                  <li><Link to="/help">Help Center</Link></li>
                  <li><Link to="/docs">Documentation</Link></li>
                  <li><Link to="/community">Community</Link></li>
                  <li><Link to="/partners">Partners</Link></li>
                  <li><Link to="/events">Events</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-lg-2">
              <div className="footer-links">
                <h6>Account</h6>
                <ul>
                  <li><Link to="/login">Log In</Link></li>
                  <li><Link to="/register">Sign Up</Link></li>
                  <li><Link to="/demo">Request Demo</Link></li>
                  <li><Link to="/support">Support</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="copyright">
                © {new Date().getFullYear()} CropVector. All rights reserved.
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex gap-4 justify-content-md-end">
                <Link to="/privacy" className="text-muted small">Privacy Policy</Link>
                <Link to="/terms" className="text-muted small">Terms of Service</Link>
                <Link to="/cookies" className="text-muted small">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}