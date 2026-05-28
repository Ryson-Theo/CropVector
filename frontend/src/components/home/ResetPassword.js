// src/components/home/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "../common/Toast";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Guard – if query params missing, bounce back
  useEffect(() => {
    if (!email || !token) {
      navigate("/forgot-password");
    }
  }, [email, token, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, otp, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        addToast("Password updated! You can now log in.", "success");
        navigate("/login");
      } else {
        addToast(data.message || "Reset failed", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Reset Your Password</h2>
          <p className="form-subtitle">
            Enter the OTP you received in the email and choose a new password.
          </p>

          <form onSubmit={handleReset}>
            <div className="input-group">
              <label>OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="123456"
              />
            </div>

            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>

          <div className="auth-footer-links">
            <p className="auth-footer">
              Remembered? <a href="/login">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}