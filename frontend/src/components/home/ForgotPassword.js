// src/components/home/ForgotPassword.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css"; // Re‑use the existing auth styling

/**
 * ForgotPassword – UI for the “I lost my password (u know )” flow.
 *
 * What it does:
 *   1 Collect the user’s email.
 *   2 POST it to our back‑end `/api/auth/forgot-password`.
 *   3️ The back‑end sends an OTP + a reset‑link to the inbox.
 *   4 Show a success or error message.
 * also i used emoji  instead of icons in this page cuz i wanted to finish it quick ; )
 * No Firebase  – we’re using the custom OTP service we built.
 * )
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // success feedback
  const [error, setError] = useState("");     // error feedback
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // The back‑end has queued an email with OTP + reset link.
        setMessage(
          "✅ Check your inbox  you'll find a reset link and a 6 digit code."
        );
      } else {
        // Propagate the server’s error message if it gave us one.
        setError(data.message || "❌ Failed to send reset instructions.");
      }
    } catch (err) {
      console.error("ForgotPassword error:", err);
      setError("❌ Network hiccup  try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left sidebar – same look as the other auth pages */}
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <h1>Reset Access</h1>
          <p>
            Don't worry, it happens. We'll help you get back to your farm dashboard
            in no time.
          </p>
        </div>
      </div>

      {/* Right‑hand form */}
      <div className="auth-form-section">
        <div className="form-wrapper">
          <div className="header-group">
            <h2 className="form-title">Forgot Password?</h2>
            <p className="form-subtitle">
              Enter your email and we'll send you a secure link plus a onetime
              OTP to reset your password.
            </p>
          </div>

          {/* Success banner */}
          {message && (
            <p
              className="success-message"
              style={{
                color: "#2d6a4f",
                background: "#f0fdf4",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              {message}
            </p>
          )}

          {/* Error banner */}
          {error && (
            <p
              className="error-message"
              style={{
                color: "#991b1b",
                background: "#fef2f2",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              {error}
            </p>
          )}

          <form onSubmit={handleReset}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="eg. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "⏳ Sending…" : "Send Reset Link"}
            </button>
          </form>

          <div className="auth-footer-links">
            <p className="auth-footer">
              Remembered your password? <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}