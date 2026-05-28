// src/components/home/VerifyOtp.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // ← added Link
import { useToast } from "../common/Toast";
import "./Auth.css";

/* --------------------------------------------------------------
   IMPORTANT: The back‑end router is mounted under this prefix.
   In your server you have:
       app.use('/api/auth', authRoutes);
   So the correct prefix is "/api/auth".  Change it here if you ever
   rename the mount point.
   -------------------------------------------------------------- */
const BASE_PATH = "/api/auth"; // ← updated to match server

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /* --------------------------------------------------------------
     Grab the e‑mail that was stored during registration.
     - location.state?.email  → passed by navigate("/verify-otp", {state:{email}})
     - sessionStorage["otpEmail"] → fallback for page refreshes
   -------------------------------------------------------------- */
  useEffect(() => {
    const stored = location.state?.email || sessionStorage.getItem("otpEmail");
    if (!stored) {
      // No e‑mail → we cannot verify, send user back to register
      addToast("Email missing – please register again.", "error");
      navigate("/register");
      return;
    }
    setEmail(stored);
  }, [location.state, navigate, addToast]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      addToast("Enter a valid 6‑digit OTP", "error");
      return;
    }

    const API_URL = process.env.REACT_APP_API_URL;
    if (!API_URL) {
      alert("REACT_APP_API_URL is not defined in .env");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}${BASE_PATH}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Server returned 4xx/5xx – show the message from back‑end
        addToast(data.message || "Invalid OTP", "error");
        setLoading(false);
        return;
      }

      // SUCCESS – OTP verified, user is now fully registered
      addToast("Registration successful! Please log in.", "success");
      sessionStorage.removeItem("otpEmail"); // clean up
      navigate("/login");
    } catch (err) {
      console.error("Verify OTP error:", err);
      addToast("Network error - try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Enter OTP</h2>
          <p className="auth-subtitle">
            We sent a code to <strong>{email}</strong>. It expires in 10 minutes.
          </p>

          <form onSubmit={handleVerify} noValidate>
            <div className="input-group">
              <label>6‑digit code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
          </form>

          <div className="auth-footer-links">
            <p className="auth-footer">
              Didn’t get it? <Link to="/register">Register again</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}