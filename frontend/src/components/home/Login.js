// src/components/home/Login.js
import React, { useState, useRef } from "react";
import {
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

/**
 * NOTE:
 *   • All back‑end calls use REACT_APP_API_URL (e.g. http://localhost:5000)
 *   • The only back‑end endpoint needed for login is /api/auth/login-firebase
 *   • We still sync the Firebase user’s basic info (name, photo, role) to our
 *     MongoDB “User” collection via the same endpoint – the server creates /
 *     updates the user record automatically.
 */

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const navigate = useNavigate();

  // -----------------------------------------------------------------
  // Configuration constants
  // -----------------------------------------------------------------
  const API_URL = process.env.REACT_APP_API_URL; // → http://localhost:5000
  const BASE_PATH = "/api/auth";                // matches server mount point

  /**
   * Send the Firebase UID (plus a few optional fields) to the back‑end.
   * The back‑end upserts the user in MongoDB and returns a JWT + the full
   * user document.
   */
  const syncWithMongoAndGetUserData = async (firebaseUser) => {
    try {
      // Normalise e‑mail – the back‑end expects lower‑case
      const normalizedEmail = firebaseUser.email?.toLowerCase() ?? "";

      // If the user arrived from a specific signup flow we stored the intended
      // role in localStorage; otherwise default to "user".
      const intendedRole = localStorage.getItem("pendingRole") || "user";

      // Payload expected by authController.loginWithFirebase
      const payload = {
        firebaseUid: firebaseUser.uid,
        fullName: firebaseUser.displayName || "User",
        email: normalizedEmail,
        profilePic: firebaseUser.photoURL,
        role: intendedRole,
      };

      // -------------------------------------------------------------
      // 1 Call the back‑end – it will upsert the user and return JWT
      // -------------------------------------------------------------
      const resp = await fetch(`${API_URL}${BASE_PATH}/login-firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        // Back‑end gave us a nice error message (e.g. “User not found”)
        throw new Error(data.message || "Login failed");
      }

      // `data` shape (from authController.loginWithFirebase):
      // {
      //   token: "<jwt>",
      //   user: { id, fullName, role, status, farmerId, roleSpecificId, … }
      // }
      return data;
    } catch (err) {
      console.error(" syncWithMongoAndGetUserData error:", err);
      throw err; // propagate to the caller
    }
  };

  // -----------------------------------------------------------------
  // Helper: decide where to send the user after we have the back‑end data
  // -----------------------------------------------------------------
  const redirectUser = (role) => {
    switch (role) {
      case "farmer":
        navigate("/farmer");
        break;
      case "expert":
        navigate("/expert");
        break;
      case "admin":
        navigate("/admin");
        break;
      case "buyer":
        navigate("/buyer");
        break;
      case "user":
        navigate("/user");
        break;
      default:
        navigate("/");
    }
  };

  // -----------------------------------------------------------------
  // Store everything we need in localStorage **before** we clear it.
  // -----------------------------------------------------------------
  const handleUserNavigation = (loginResult) => {
    if (!loginResult) {
      setError("Failed to sync user data. Please try again.");
      return;
    }

    const { token, user } = loginResult;

    // Preserve the MongoDB user ID – required for post‑owner checks, etc.
    const userId = user.id || user._id;
    const farmerId = user.farmerId;
    const roleSpecificId = user.roleSpecificId;

    // Clear any stale session data first
    localStorage.clear();

    // Store the new session
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userStatus", user.status);
    localStorage.setItem("userName", user.fullName);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userId", userId);
    localStorage.setItem("token", token);

    if (farmerId) {
      localStorage.setItem("farmerId", farmerId);
    }

    if (roleSpecificId) {
      localStorage.setItem("roleSpecificId", roleSpecificId);
    }

    // -------------------------------------------------------------
    // 3 Decide what to show the user based on account status
    // -------------------------------------------------------------
    if (user.status === "pending") {
      navigate("/pending-approval");
    } else if (user.status === "rejected") {
      setError(
        "Your account has been rejected. Please contact support."
      );
      localStorage.clear();
    } else {
      // Approved – send them to the correct dashboard
      redirectUser(user.role);
    }
  };

  // -----------------------------------------------------------------
  // Email / password login flow
  // -----------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    setIsSubmitting(true);

    try {
      // Use custom backend for email/password login to ensure we use the latest password (from MongoDB)
      const resp = await fetch(`${API_URL}${BASE_PATH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        throw new Error(text || 'Invalid server response');
      }

      if (!resp.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      // Store session & navigate
      handleUserNavigation(data);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // Google OAuth login flow – identical after we have a FirebaseUser
  // -----------------------------------------------------------------
  const googleLogin = async () => {
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loginResult = await syncWithMongoAndGetUserData(
        result.user
      );
      handleUserNavigation(loginResult);
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed.");
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <h1>Welcome Back</h1>
          <p>Login to manage your crops, equipment, and profile.</p>
          <div className="steps-container">
            <div className="step-card active">
              <span className="step-number">✓</span>
              <p>Secure Login</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="form-wrapper">
          <h2 className="form-title">Login to Account</h2>
          <p className="auth-subtitle">
            Enter your credentials to access your dashboard.
          </p>

          {/* ---------- Social (Google) ---------- */}
          <div className="social-login-container">
            <button
              className="social-btn google"
              onClick={googleLogin}
              type="button"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
              />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* ---------- Divider ---------- */}
          <div className="divider">
            <span>Or use email</span>
          </div>

          {/* ---------- Error message ---------- */}
          {error && (
            <p
              className="error-message"
              style={{ color: "red", textAlign: "center" }}
            >
              {error}
            </p>
          )}

          {/* ---------- Email / Password form ---------- */}
          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="eg. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-row">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* ---------- Footer links ---------- */}
          <div className="auth-footer-links">
            <p className="auth-footer">
              Don't have an account?{" "}
              <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}