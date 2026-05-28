// src/components/home/UserRegister.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";
import "./Auth.css";

/* ---------------- Validation Helpers ---------------- */
const isValidEmail = (str) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
const isStrongPassword = (str) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(str);
const isValidPhone = (str) => /^\d{10}$/.test(str);
const isNonEmpty = (str) => str && str.trim().length > 0;

/* ------------------- Component ------------------- */
export default function UserRegister() {
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
      profilePic; // picture required for the final step

    setCanSubmit(valid);
  }, [
    fullName,
    email,
    password,
    phone,
    place,
    address,
    profilePic,
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
    }[field];

    if (!invalid) return null;

    const messages = {
      fullName: "Full name is required.",
      email: "Enter a valid e-mail.",
      password: "≥8 chars, letters + numbers.",
      phone: "Exactly 10 digits.",
      place: "City is required.",
      address: "Address cannot be empty.",
      profilePic: "Profile picture required.",
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

  /* ---------- EMAIL/PASSWORD REGISTRATION → OTP ---------- */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      // 1 Create Firebase account
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUid = userCred.user.uid;

      // 2 Build the **payload** that we’ll need after OTP verification
      const payload = {
        fullName,
        email,
        password,
        phone,
        place,
        address,
        role: "user",
        firebaseUid,
      };

      // Store payload + a flag that tells us we have a profile picture to upload later
      sessionStorage.setItem("regPayload", JSON.stringify(payload));
      sessionStorage.setItem("otpEmail", email);
      sessionStorage.setItem("otpName", fullName);
      sessionStorage.setItem("hasUserFiles", "true");

      // 3 Request OTP – **only text fields**, no files (upload.none() on the back‑end)
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        formData.append(k, v);
      });

      const res = await fetch(`${API_URL}${BASE_PATH}/request-otp`, {
        method: "POST",
        body: formData, // multipart, but contains only text fields
      });

      const data = await res.json();

      if (!res.ok) {
        // Roll back the Firebase user if the back‑end failed
        await auth.currentUser?.delete();
        addToast(data.message || "Failed to send OTP", "error");
        setLoading(false);
        return;
      }

      // 4 Success toast + navigate to OTP verification page
      addToast("✅ OTP sent! Check your inbox.", "success");
      navigate("/verify-otp");
    } catch (err) {
      console.error("User register error:", err);
      addToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- GOOGLE SIGN‑UP → OTP ---------- */
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Payload for the final user record (no password because Google handled auth)
      const payload = {
        fullName: user.displayName,
        email: user.email,
        firebaseUid: user.uid,
        role: "user",
        googleSignup: true,
      };

      // Store payload – we’ll still need it after OTP verification
      sessionStorage.setItem("regPayload", JSON.stringify(payload));
      sessionStorage.setItem("otpEmail", user.email);
      sessionStorage.setItem("otpName", user.displayName);
      // No profile picture for Google signup (you could let the user add one later)

      // Request OTP (text‑only)
      const res = await fetch(`${API_URL}${BASE_PATH}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          fullName: user.displayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If the back‑end refused, delete the temporary Firebase user
        await auth.currentUser?.delete();
        addToast(data.message || "OTP failed", "error");
        return;
      }

      addToast("✅ OTP sent! Verify to continue.", "success");
      navigate("/verify-otp");
    } catch (err) {
      console.error("Google signup error:", err);
      addToast("Google signup failed. Try again.", "error");
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="auth-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="auth-sidebar">
        <div className="sidebar-content">
          <h1>Join Our Community</h1>
          <p>Create an account to start using our platform.</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">User Registration</h2>

          {/* ---------- Google signup ---------- */}
          <div className="social-login-container">
            <button
              className="social-btn google"
              onClick={handleGoogleSignup}
              type="button"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
              />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="divider">
            <span>Or register with email</span>
          </div>

          {/* ---------- Email / password form ---------- */}
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

            {/* ---------- Phone + City ---------- */}
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
                <label>City</label>
                <input
                  type="text"
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                required
              />
              {renderHint("address")}
            </div>

            {/* ---------- Profile picture ---------- */}
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
              {loading ? "Sending OTP…" : "Create Account"}
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