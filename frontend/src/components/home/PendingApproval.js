import React from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function PendingApproval() {
  return (
    <div className="auth-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="form-wrapper" style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2 className="form-title">Application Submitted!</h2>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>⏳</div>
        <p className="form-subtitle">
          Thank you for joining CropVector. Your documents (License and Profile) 
          are currently being reviewed by our administration team.
        </p>
        <p style={{ color: "#aaa", marginBottom: "30px" }}>
          You will be able to log in once your account has been approved. 
          This usually takes 24-48 hours.
        </p>
        <Link to="/login" className="submit-btn" style={{ textDecoration: 'none', display: 'block' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}