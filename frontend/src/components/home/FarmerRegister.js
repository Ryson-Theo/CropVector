// src/components/home/FarmerRegister.js
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
export default function FarmerRegister() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  /* ---------- Form state ---------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  /* ---------- Validation ---------- */
  useEffect(() => {
    const valid =
      isNonEmpty(fullName) &&
      isValidEmail(email) &&
      isStrongPassword(password) &&
      isValidPhone(phone) &&
      isNonEmpty(place) &&
      isNonEmpty(address) &&
      profilePic &&
      license;

    setCanSubmit(valid);
  }, [
    fullName,
    email,
    password,
    phone,
    place,
    address,
    profilePic,
    license,
  ]);

  /* ---------- Hint rendering (focus‑based) ---------- */
  const renderHint = (field) => {
    if (focusedField !== field) return null;

    const invalid = {
      fullName: !isNonEmpty(fullName),
      email: !isValidEmail(email),
      password: !isStrongPassword(password),
      phone: !isValidPhone(phone),
      place: !isNonEmpty(place),
      address: !isNonEmpty(address),
      profilePic: !profilePic,
      license: !license,
    }[field];

    if (!invalid) return null;

    const messages = {
      fullName: "Full name is required.",
      email: "Enter a valid e‑mail.",
      password: "≥8 chars, letters + numbers.",
      phone: "Exactly 10 digits.",
      place: "City is required.",
      address: "Address cannot be empty.",
      profilePic: "Profile picture required.",
      license: "License document required.",
    };

    return (
      <p
        style={{
          color: "#b71c1c",
          fontSize: "0.85rem",
          marginTop: "4px",
        }}
      >
        {messages[field]}
      </p>
    );
  };

  /* ---------- Base‑URL constants ---------- */
  const API_URL = process.env.REACT_APP_API_URL; // → http://localhost:5000
  const BASE_PATH = "/api/auth";                // matches server mount point

  /* ---------- Hybrid OTP flow ---------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      //  Create Firebase account
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUid = userCred.user.uid;

      //  Build the **payload** that will be needed after OTP verification
      const payload = {
        fullName,
        email,
        password,
        phone,
        place,
        address,
        role: "farmer",
        firebaseUid,
      };

      // Store the payload and a flag that tells us we have files to upload later
      sessionStorage.setItem("regPayload", JSON.stringify(payload));
      sessionStorage.setItem("otpEmail", email);
      sessionStorage.setItem("otpName", fullName);
      sessionStorage.setItem("hasFarmerFiles", "true"); // remember we have files

      //  Request OTP – text fields + profile picture
      const formData = new FormData();
      // Populate the same fields the back‑end expects for OTP creation
      Object.entries(payload).forEach(([key, val]) => {
        formData.append(key, val);
      });
      // Append profile picture and license if provided
      if (profilePic) formData.append("profilePic", profilePic);
      if (license) formData.append("license", license);

      const res = await fetch(`${API_URL}${BASE_PATH}/request-otp`, {
        method: "POST",
        body: formData, // multipart, but only text fields
      });

      const data = await res.json();

      if (!res.ok) {
        // Roll back the Firebase user if the back‑end failed
        await auth.currentUser?.delete();
        addToast(data.message || "Failed to send OTP", "error");
        setLoading(false);
        return;
      }

      //  Success toast + navigate to OTP verification page
      addToast("✅ OTP sent! Check your inbox.", "success");
      navigate("/verify-otp");
    } catch (err) {
      console.error("Farmer register error:", err);
      addToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="auth-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="auth-sidebar">
        <div className="sidebar-content">
          <h1>Farmer Verification</h1>
          <p>Please provide your credentials for admin review.</p>
          <div className="steps-container">
            <div className="step-card active">
              <span className="step-number">1</span>
              <p>Submit Data</p>
            </div>
            <div className="step-card">
              <p>Email Verification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Farmer Registration</h2>

          <form onSubmit={handleRegister} noValidate>
            {/* ---------- Full name ---------- */}
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                required
              />
              {renderHint("fullName")}
            </div>

            {/* ---------- Phone + Place ---------- */}
            <div className="input-row">
              <div className="input-group">
                <label>Phone (10 digits)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("phone")}
              </div>

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
            </div>

            {/* ---------- Address ---------- */}
            <div className="input-group">
              <label>Address</label>
              <input
                type="text"
                placeholder="Full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                required
              />
              {renderHint("address")}
            </div>

            {/* ---------- Files: Profile picture + License ---------- */}
            <div className="input-row">
              <div className="input-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePic(e.target.files[0])}
                  onFocus={() => setFocusedField("profilePic")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("profilePic")}
              </div>

              <div className="input-group">
                <label>Licence (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setLicense(e.target.files[0])}
                  onFocus={() => setFocusedField("license")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("license")}
              </div>
            </div>

            {/* ---------- Email + Password ---------- */}
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

            {/* ---------- Submit ---------- */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !canSubmit}
            >
              {loading ? "Sending OTP…" : "Submit for Verification"}
            </button>
          </form>

          {/* ---------- Footer links ---------- */}
          <div className="auth-footer-links">
            <Link to="/register" className="back-link">
              ← Back to Role Selection
            </Link>
            <p className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}