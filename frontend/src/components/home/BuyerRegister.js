// src/components/home/BuyerRegister.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";
import "./Auth.css";

/* ---------------- Validation Helpers ---------------- */
const isValidPhone = (str) => /^\d{10}$/.test(str);
const isValidEmail = (str) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
const isStrongPassword = (str) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(str);
const isNonEmpty = (str) => str && str.trim().length > 0;

/* ------------------- Component ------------------- */
export default function BuyerRegister() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  // ---------- Form state ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("Shop");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState(null); // still kept for UI, but NOT sent to OTP
  const [loading, setLoading] = useState(false);

  // ---------- Validation ----------
  const [canSubmit, setCanSubmit] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const ok =
      isNonEmpty(fullName) &&
      isValidEmail(email) &&
      isStrongPassword(password) &&
      isValidPhone(phone) &&
      isNonEmpty(place) &&
      isNonEmpty(address);
    setCanSubmit(ok);
  }, [fullName, email, password, phone, place, address]);

  // ---------- Where the back‑end lives ----------
  // Change this ONE line if you ever move the router again
  const BASE_PATH = "/api/auth"; // <-- matches server mount point

  // ---------- Register handler ----------
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const API_URL = process.env.REACT_APP_API_URL;
    if (!API_URL) {
      alert("REACT_APP_API_URL is not defined in .env");
      return;
    }

    setLoading(true);
    try {
      // 1️ Firebase registration
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUid = cred.user.uid;

      // 2️ Build FormData for the back‑end WITH profilePic
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("businessType", businessType);
      formData.append("place", place);
      formData.append("address", address);
      formData.append("firebaseUid", firebaseUid);
      formData.append("role", "buyer"); // hard‑coded for this UI
      // Send profile picture if provided
      if (profilePic) formData.append("profilePic", profilePic);

      // 3️ Send OTP request
      const res = await fetch(`${API_URL}${BASE_PATH}/request-otp`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Back‑end reported an error – roll back the Firebase user
        await auth.currentUser?.delete();
        addToast(data.message || "Failed to send OTP", "error");
        setLoading(false);
        return;
      }

      // 4️ Store e‑mail for the OTP verification page
      sessionStorage.setItem("otpEmail", email);

      // 5️ Success toast + navigation
      addToast("✅ OTP sent! Check your inbox.", "success");
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      console.error("🛑 Register error:", err);
      addToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render hint for a field ----------
  const renderHint = (field) => {
    if (focusedField !== field) return null;
    const empty = {
      fullName: !isNonEmpty(fullName),
      email: !isValidEmail(email),
      password: !isStrongPassword(password),
      phone: !isValidPhone(phone),
      place: !isNonEmpty(place),
      address: !isNonEmpty(address),
    }[field];
    if (!empty) return null;

    const messages = {
      fullName: "Full name is required.",
      email: "Enter a valid email.",
      password: "≥8 chars, letters + numbers.",
      phone: "Exactly 10 digits.",
      place: "City / place required.",
      address: "Delivery address required.",
    };
    return (
      <p
        className="field-hint"
        style={{
          color: "#b71c1c",
          marginTop: "4px",
          fontSize: "0.85rem",
        }}
      >
        {messages[field]}
      </p>
    );
  };

  // ---------- JSX ----------
  return (
    <div className="auth-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="auth-sidebar">
        <div className="sidebar-content">
          <h1>Buyer Account</h1>
          <p>
            Join as a business buyer to access wholesale crops and rental
            equipment.
          </p>
          <div className="steps-container">
            <div className="step-card active">
              <span className="step-number">1</span>
              <p>Create Account</p>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <p>Start Sourcing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Buyer Registration</h2>

          <form onSubmit={handleRegister} noValidate>
            {/* ---------- Full name ---------- */}
            <div className="input-group">
              <label>Full Name / Contact Person</label>
              <input
                type="text"
                placeholder="Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                required
              />
              {renderHint("fullName")}
            </div>

            {/* ---------- Business type + Phone ---------- */}
            <div className="input-row">
              <div className="input-group">
                <label>Business Type</label>
                <select
                  className="auth-select"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="Shop">Retail Shop</option>
                  <option value="Restaurant">Restaurant / Hotel</option>
                  <option value="Wholesale">Wholesale Dealer</option>
                  <option value="Individual">Individual Bulk Buyer</option>
                  <option value="Other">Other Business</option>
                </select>
              </div>

              <div className="input-group">
                <label>Phone (10 digits)</label>
                <input
                  type="tel"
                  placeholder="0123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("phone")}
              </div>
            </div>

            {/* ---------- Place + Profile pic ---------- */}
            <div className="input-row">
              <div className="input-group">
                <label>Place (City)</label>
                <input
                  type="text"
                  placeholder="e.g. Nairobi"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  onFocus={() => setFocusedField("place")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("place")}
              </div>

              <div className="input-group">
                <label>Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePic(e.target.files[0])}
                />
              </div>
            </div>

            {/* ---------- Delivery address ---------- */}
            <div className="input-group">
              <label>Delivery Address</label>
              <input
                type="text"
                placeholder="Full Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                required
              />
              {renderHint("address")}
            </div>

            {/* ---------- Email + Password ---------- */}
            <div className="input-row">
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("email")}
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="≥8 chars, letters + numbers"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("password")}
              </div>
            </div>

            {/* ---------- Submit button ---------- */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !canSubmit}
            >
              {loading ? "Sending OTP…" : "Register"}
            </button>
          </form>

          {/* ---------- Footer links ---------- */}
          <div className="auth-footer-links">
            <Link to="/register" className="back-link">
              ← Back
            </Link>
            <p className="auth-footer">
              Need to sell?{" "}
              <Link to="/register/farmer">Register as Farmer</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}