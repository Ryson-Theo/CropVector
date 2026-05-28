// src/components/home/RequestOtp.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../common/Toast";
import "./Auth.css";

/* --------------------------------------------------------------
   Same base‑path constant as VerifyOtp – keep them in sync.
   -------------------------------------------------------------- */
const BASE_PATH = "/auth"; // change to "/api/auth" if  server uses that prefix

export default function RequestOtp() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const API_URL = process.env.REACT_APP_API_URL;
    if (!API_URL) {
      alert("REACT_APP_API_URL is not defined in .env");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}${BASE_PATH}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast("OTP sent! Check your inbox.", "success");
        // Store the e‑mail & name for the next step (VerifyOtp reads from sessionStorage)
        sessionStorage.setItem("otpEmail", email);
        sessionStorage.setItem("otpName", fullName);
        navigate("/verify-otp");
      } else {
        addToast(data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      console.error("Request OTP error:", err);
      addToast("Network error – try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Verify Your Email</h2>
          <p className="auth-subtitle">
            We'll send a 6‑digit code to your inbox. Enter it below to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>

          <div className="auth-footer-links">
            <p className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}