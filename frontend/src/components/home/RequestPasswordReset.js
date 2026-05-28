// src/components/home/RequestPasswordReset.js
import React, { useState } from "react";
import { useToast } from "../common/Toast";
import "./Auth.css";

export default function RequestPasswordReset() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        addToast("Reset link sent! Check your inbox.", "success");
      } else {
        addToast(data.message || "Failed to send reset", "error");
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
          <h2 className="form-title">Forgot Password?</h2>
          <p className="form-subtitle">
            Enter your email and we'll send a reset link plus an OTP.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
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