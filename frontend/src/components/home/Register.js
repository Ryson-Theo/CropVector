import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Ordinary User",
      desc: "Access community posts, expert consultations, and basic features.",
      path: "/register/user",
      icon: <img src="https://images.unsplash.com/photo-1630441466350-d053acf63b22?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="User" />,
      className: ""
    },
    {
      title: "Farmer",
      desc: "Sell your harvest, manage farm data, and get verified tools.",
      path: "/register/farmer",
      icon: <img src="https://images.unsplash.com/photo-1688892039994-37ee71aa23bc?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Farmer" />,
      className: "farmer-card"
    },
    {
      title: "Expert",
      desc: "Diagnose crop diseases, provide consultancy, and verify products.",
      path: "/register/expert",
      icon: <img src="https://images.unsplash.com/photo-1758524052155-f3a6fea3084e?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Expert" />,
      className: "expert-card"
    },
    {
      title: "Buyer / Retailer",
      desc: "Bulk purchase crops, rent heavy equipment, and manage orders.",
      path: "/register/buyer",
      icon: <img src="https://images.unsplash.com/photo-1573481078935-b9605167e06b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Buyer" />,
      className: "buyer-special"
    }
  ];

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <div className="brand-badge">CropVector</div>
          <h1>Get Started with Us</h1>
          <p>Choose your path to begin managing agriculture smarter.</p>
          <div className="steps-container">
            <div className="step-card active">
              <span className="step-number">1</span>
              <p>Choose your role</p>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <p>Setup Profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="form-wrapper">
          <div className="header-group">
            <h2 className="form-title">Join our ecosystem</h2>
            <p className="form-subtitle">Select the account type that best describes you</p>
          </div>

          <div className="role-selection-grid">
            {roles.map((role, index) => (
              <div 
                key={index} 
                className={`role-option-card ${role.className}`} 
                onClick={() => navigate(role.path)}
              >
                <div className="role-icon-wrapper">{role.icon}</div>
                <div className="role-text">
                  <div className="role-header">
                    <h3>{role.title}</h3>
                    <span className="arrow-icon">→</span>
                  </div>
                  <p>{role.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-footer-links">
            <p className="auth-footer">
              Already have an account? <Link to="/login" className="login-link">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}