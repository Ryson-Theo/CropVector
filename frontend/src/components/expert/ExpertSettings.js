import React, { useState } from "react";
import {
  Bell,
  Eye,
  Shield,
  CheckCircle,
  Loader
} from "lucide-react";
import axios from "axios";
import { useToast } from "../common/Toast";
import Toast from "../common/Toast";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api/auth";

/* ===================== STYLES ===================== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif"
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 24
  },
  card: {
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e2e8f0"
  },
  sidebar: {
    padding: 12
  },
  main: {
    padding: 32
  },
  heading: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 24,
    color: "#0f172a"
  },
  sectionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  stepText: {
    fontSize: 12,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5f5",
    fontSize: 14,
    outline: "none"
  },
  button: {
    background: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8
  },
  buttonDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed"
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 0",
    borderBottom: "1px solid #e2e8f0"
  },
  toggleInfo: {
    display: "flex",
    gap: 14,
    alignItems: "center"
  },
  toggleTitle: {
    fontWeight: 500,
    color: "#0f172a"
  },
  toggleDesc: {
    fontSize: 13,
    color: "#64748b"
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#059669"
  },
  sidebarItem: (active) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 10,
    background: active ? "#ecfdf5" : "transparent",
    color: active ? "#047857" : "#475569",
    fontWeight: 500,
    border: "none",
    cursor: "pointer"
  })
};

const ExpertSettings = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const userEmail = localStorage.getItem("userEmail");
  const token = localStorage.getItem("token");

  const [passStep, setPassStep] = useState(1);
  const [passOtp, setPassOtp] = useState("");
  const [passOtpToken, setPassOtpToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailStep, setEmailStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  /* ================= PASSWORD FLOW ================= */
  const handleRequestPassOtp = async () => {
    if (!userEmail) return addToast("User email not found. Please login again.", "error");
    setPasswordLoading(true);
    try {
      await axios.post(`${API_BASE}/otp/generate`, { email: userEmail });
      addToast("OTP sent to your email.", "success");
      setPassStep(2);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to send OTP.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyPassOtp = async () => {
    if (!passOtp) return addToast("Please enter the OTP.", "error");
    setPasswordLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/otp/verify`, { email: userEmail, otp: passOtp });
      if (res.data.otpToken) {
        setPassOtpToken(res.data.otpToken);
      }
      setPassStep(3);
      addToast("OTP verified.", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Invalid OTP.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return addToast("Please fill all fields.", "error");
    if (newPassword !== confirmPassword) {
      return addToast("Passwords do not match.", "error");
    }
    setPasswordLoading(true);
    try {
      await axios.post(`${API_BASE}/password/reset`, {
        email: userEmail,
        password: newPassword,
        otp: passOtp,
        otpToken: passOtpToken
      });
      addToast("Password updated successfully.", "success");
      setPassStep(1);
      setPassOtp("");
      setPassOtpToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update password.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ================= EMAIL FLOW ================= */
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) return addToast("Please enter your current password.", "error");
    setEmailLoading(true);
    try {
      await axios.post(
        `${API_BASE}/verify-password`,
        { email: userEmail, password: currentPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailStep(2);
    } catch (err) {
      addToast(err.response?.data?.message || "Incorrect password.", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestEmailOtp = async () => {
    if (!newEmail) return addToast("Please enter a new email address.", "error");
    if (newEmail === userEmail) return addToast("New email must be different.", "error");
    
    setEmailLoading(true);
    try {
      await axios.post(`${API_BASE}/otp/generate`, { email: newEmail });
      setEmailStep(3);
      addToast("OTP sent to new email.", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to send OTP.", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailOtp) return addToast("Please enter the OTP.", "error");
    setEmailLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/email/update`,
        { oldEmail: userEmail, newEmail, otp: emailOtp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("userEmail", newEmail);
      if (res.data?.token) localStorage.setItem("token", res.data.token);
      addToast("Email updated successfully.", "success");
      setEmailStep(1);
      setCurrentPassword("");
      setNewEmail("");
      setEmailOtp("");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update email.", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div style={styles.container}>
        {/* SIDEBAR */}
        <aside style={{ ...styles.card, ...styles.sidebar }}>
          <SidebarItem
            icon={<Bell size={18} />}
            label="Account"
            active={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          />
          <SidebarItem
            icon={<Shield size={18} />}
            label="Security"
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
        </aside>

        {/* MAIN */}
        <main style={{ ...styles.card, ...styles.main }}>
          {activeTab === "account" && (
            <>
              <h2 style={styles.heading}>Account Preferences</h2>
              <ToggleRow icon={<Bell />} title="Notifications" desc="Receive alerts and system notifications" />
              <ToggleRow icon={<Eye />} title="Public Profile" desc="Allow others to see your public activity" />
            </>
          )}

          {activeTab === "security" && (
            <>
              <h2 style={styles.heading}>Security</h2>

              <SecurityCard title="Change Password" step={passStep}>
                {passStep === 1 && (
                  <PrimaryButton loading={passwordLoading} text="Send OTP" onClick={handleRequestPassOtp} />
                )}
                {passStep === 2 && (
                  <>
                    <Input value={passOtp} onChange={setPassOtp} placeholder="Enter OTP" />
                    <PrimaryButton loading={passwordLoading} text="Verify OTP" onClick={handleVerifyPassOtp} />
                  </>
                )}
                {passStep === 3 && (
                  <>
                    <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="New Password" />
                    <Input type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm Password" />
                    <PrimaryButton loading={passwordLoading} text="Update Password" onClick={handleUpdatePassword} />
                  </>
                )}
              </SecurityCard>

              <SecurityCard title="Change Email" step={emailStep}>
                {emailStep === 1 && (
                  <>
                    <Input type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Current Password" />
                    <PrimaryButton loading={emailLoading} text="Verify Password" onClick={handleVerifyCurrentPassword} />
                  </>
                )}
                {emailStep === 2 && (
                  <>
                    <Input type="email" value={newEmail} onChange={setNewEmail} placeholder="New Email" />
                    <PrimaryButton loading={emailLoading} text="Send OTP" onClick={handleRequestEmailOtp} />
                  </>
                )}
                {emailStep === 3 && (
                  <>
                    <Input value={emailOtp} onChange={setEmailOtp} placeholder="Enter OTP" />
                    <PrimaryButton loading={emailLoading} text="Update Email" onClick={handleUpdateEmail} />
                  </>
                )}
              </SecurityCard>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

/* ================= SUB COMPONENTS ================= */

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button style={styles.sidebarItem(active)} onClick={onClick}>
    {icon}
    {label}
  </button>
);

const ToggleRow = ({ icon, title, desc }) => (
  <div style={styles.toggleRow}>
    <div style={styles.toggleInfo}>
      {icon}
      <div>
        <div style={styles.toggleTitle}>{title}</div>
        <div style={styles.toggleDesc}>{desc}</div>
      </div>
    </div>
    <input type="checkbox" defaultChecked style={styles.checkbox} />
  </div>
);

const SecurityCard = ({ title, step, children }) => (
  <div style={styles.sectionCard}>
    <div style={styles.sectionHeader}>
      <strong>{title}</strong>
      <span style={styles.stepText}>
        <CheckCircle size={14} /> Step {step} of 3
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
      {children}
    </div>
  </div>
);

const Input = ({ type = "text", value, onChange, placeholder }) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    style={styles.input}
  />
);

const PrimaryButton = ({ text, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      ...styles.button,
      ...(loading ? styles.buttonDisabled : {})
    }}
  >
    {loading && <Loader size={16} />}
    {text}
  </button>
);

export default ExpertSettings;