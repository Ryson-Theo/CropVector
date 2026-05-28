// src/components/home/ExpertRegister.js
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
const isPositiveNumber = (n) => !isNaN(n) && Number(n) >= 0;

/* ------------------- Component ------------------- */
export default function ExpertRegister() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  /* ---------- Form state ---------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [qualification, setQualification] = useState(null);
  const [loading, setLoading] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  /* ---------- Validation logic ---------- */
  useEffect(() => {
    const valid =
      isNonEmpty(fullName) &&
      isValidEmail(email) &&
      isStrongPassword(password) &&
      isValidPhone(phone) &&
      isNonEmpty(specialization) &&
      isPositiveNumber(experience) &&
      isNonEmpty(address) &&
      profilePic &&
      qualification;

    setCanSubmit(valid);
  }, [
    fullName,
    email,
    password,
    phone,
    specialization,
    experience,
    address,
    profilePic,
    qualification,
  ]);

  /* ---------- Hint rendering (focus‑based) ---------- */
  const renderHint = (field) => {
    if (focusedField !== field) return null;

    const invalid = {
      fullName: !isNonEmpty(fullName),
      email: !isValidEmail(email),
      password: !isStrongPassword(password),
      phone: !isValidPhone(phone),
      specialization: !isNonEmpty(specialization),
      experience: !isPositiveNumber(experience),
      address: !isNonEmpty(address),
      profilePic: !profilePic,
      qualification: !qualification,
    }[field];

    if (!invalid) return null;

    const messages = {
      fullName: "Full name is required.",
      email: "Enter a valid e‑mail.",
      password: "≥8 chars, letters + numbers.",
      phone: "Exactly 10 digits.",
      specialization: "Specialization is required.",
      experience: "Enter a valid number of years (0 or more).",
      address: "Address cannot be empty.",
      profilePic: "Profile image required.",
      qualification: "Qualification document required.",
    };

    return (
      <p
        className="field-hint"
        style={{ color: "#b71c1c", marginTop: "4px", fontSize: "0.85rem" }}
      >
        {messages[field]}
      </p>
    );
  };

  /* ---------- Base URL constants ---------- */
  const API_URL = process.env.REACT_APP_API_URL; // → http://localhost:5000
  const BASE_PATH = "/api/auth";                // matches server mount point

  /* ---------- Register (Hybrid) flow ---------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      // 1️ Create Firebase account
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUid = userCred.user.uid;

      // 2️ Build the **FormData** payload for the OTP step.
      //    – All required fields and files are included.
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("specialization", specialization);
      formData.append("experience", experience);
      formData.append("address", address);
      formData.append("role", "expert");          // <-- role for back‑end
      formData.append("firebaseUid", firebaseUid); // <-- needed for login‑firebase later
      // Append files if provided
      if (profilePic) formData.append("profilePic", profilePic);
      if (qualification) formData.append("qualification", qualification);

      // 3️ Store the **payload** and the **files** in sessionStorage.
      //    We'll retrieve them after the OTP is verified.
      sessionStorage.setItem("regPayload", JSON.stringify({
        fullName,
        email,
        password,
        phone,
        specialization,
        experience,
        address,
        role: "expert",
        firebaseUid,
      }));
      sessionStorage.setItem("hasExpertFiles", "true"); // flag for later step

      // 4️ Request OTP (multipart request with files)
      const res = await fetch(`${API_URL}${BASE_PATH}/request-otp`, {
        method: "POST",
        body: formData,               // multipart, includes files
      });

      const data = await res.json();

      if (!res.ok) {
        // Roll back Firebase if the back‑end failed
        await auth.currentUser?.delete();
        addToast(data.message || "Failed to send OTP", "error");
        setLoading(false);
        return;
      }

      // 5️ Store email for OTP page and navigate
      sessionStorage.setItem("otpEmail", email);
      addToast("✅ OTP sent! Check your inbox.", "success");
      navigate("/verify-otp");
    } catch (err) {
      // If Firebase user was created but backend failed, try to delete it.
      auth.currentUser?.delete().catch(e => console.warn("Failed to clean up Firebase user on error:", e));
      console.error("Expert register error:", err);
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
          <h1>Expert Verification</h1>
          <p>Provide your professional details for our panel review.</p>
          <div className="steps-container">
            <div className="step-card active">
              <span className="step-number">1</span>
              <p>Submit Credentials</p>
            </div>
            <div className="step-card">
              <p>Expert Review</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Expert Registration</h2>

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

            {/* ---------- Phone + Specialization ---------- */}
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
                <label>Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  onFocus={() => setFocusedField("specialization")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("specialization")}
              </div>
            </div>

            {/* ---------- Experience + Email ---------- */}
            <div className="input-row">
              <div className="input-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  onFocus={() => setFocusedField("experience")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("experience")}
              </div>

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
            </div>

            {/* ---------- Address ---------- */}
            <div className="input-group">
              <label>Office / Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                required
              />
              {renderHint("address")}
            </div>

            {/* ---------- Files: Profile Pic + Qualification ---------- */}
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
                <label>Qualification (PDF / Cert)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setQualification(e.target.files[0])}
                  onFocus={() => setFocusedField("qualification")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {renderHint("qualification")}
              </div>
            </div>

            {/* ---------- Password ---------- */}
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
              {loading ? "Sending OTP…" : "Register as Expert"}
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