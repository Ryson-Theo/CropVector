// backend/utils/mailTemplates.js

// style for emails - clean and nice
const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #212529;
  line-height: 1.6;
  max-width: 620px;
  margin: 0 auto;
  padding: 24px;
`;

const cardStyle = `
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  overflow: hidden;
`;

const headerStyle = `
  background: #f5f5f7;
  padding: 20px 24px;
  text-align: center;
`;

const titleStyle = `
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #007aff;
`;

const bodyStyle = `
  padding: 24px;
`;

const buttonStyle = `
  display: inline-block;
  background: #007aff;
  color: #ffffff;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 15px;
  margin-top: 20px;
`;

const footer = `
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;">
  <small style="color:#6c757d;">© ${new Date().getFullYear()} CropVector – All rights reserved.</small>
`;

// otp code email
exports.otpTemplate = ({
  name = "Friend",
  otp,
  expiry = 10,
}) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}">Your CropVector verification code</h2>
    </div>
    <div style="${bodyStyle}">
      <p>Hello ${name},</p>
      <p>Use the six‑digit code below to verify your e‑mail address. It expires in <strong>${expiry} minutes</strong>.</p>
      <p style="font-size:28px; font-weight:600; letter-spacing:2px; text-align:center; margin:24px 0;">${otp}</p>
      ${footer}
    </div>
  </div>
</div>
`;

// welcome email based on user role
exports.welcomeTemplate = ({
  name = "Friend",
  role = "user", // farmer | buyer | expert | admin | user
}) => {
  // Feature list per role – feel free to extend
  const features = {
    farmer: [
      "Smart land & soil input wizard",
      "AI‑driven crop suggestions",
      "Lifecycle tracker & expense log",
      "Real‑time weather alerts",
      "Community knowledge hub",
    ],
    buyer: [
      "Search local farms by crop & distance",
      "View farmer reputation & history",
      "Create digital contracts & invoices",
      "Track order status from negotiation to delivery",
    ],
    expert: [
      "Validate community posts",
      "Publish region‑specific alerts",
      "Manage expert badge & profile",
    ],
    admin: [
      "User & role management",
      "Approve expert accounts",
      "Monitor platform activity",
    ],
    user: [
      "Explore the CropVector community",
      "Share DIY farming tips",
      "Discover expert‑verified content",
    ],
  };

  const listItems = (features[role] || features.user)
    .map(item => `<li>${item}</li>`)
    .join("");

  return `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}">Welcome to CropVector, ${name}!</h2>
    </div>
    <div style="${bodyStyle}">
      <p>We’re thrilled you’ve joined as a <strong>${role}</strong>. Here’s a quick tour of what you can do right away:</p>
      <ul style="margin-left:20px; line-height:1.5;">
        ${listItems}
      </ul>
      <a href="{{APP_URL}}" style="${buttonStyle}">Go to Dashboard</a>
      ${footer}
    </div>
  </div>
</div>
`;
};

/**
 * ------------------------------------------------------------
 *  3 APPROVAL TEMPLATE – wraps the welcome message
 * ------------------------------------------------------------
 */
exports.approvalTemplate = ({
  name = "Friend",
  role = "user",
}) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}">Your account has been approved!</h2>
    </div>
    <div style="${bodyStyle}">
      <p>Congratulations ${name}, your <strong>${role}</strong> account is now active.</p>
      ${exports.welcomeTemplate({ name, role })}
    </div>
  </div>
</div>
`;

// account approved email
exports.rejectionTemplate = ({
  name = "Friend",
  reason = "No reason provided.",
}) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}; color:#d9534f;">Registration declined</h2>
    </div>
    <div style="${bodyStyle}">
      <p>Hello ${name},</p>
      <p>We’re sorry to inform you that your registration could not be approved.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      ${footer}
    </div>
  </div>
</div>
`;

// login notification email
exports.loginNotifyTemplate = ({
  name = "Friend",
  device = "Web browser",
  time = new Date().toLocaleString(),
}) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}">New sign‑in to your CropVector account</h2>
    </div>
    <div style="${bodyStyle}">
      <p>Hi ${name},</p>
      <p>We detected a successful sign‑in from <strong>${device}</strong> on <strong>${time}</strong>.</p>
      <p>If this wasn’t you, please reset your password immediately.</p>
      ${footer}
    </div>
  </div>
</div>
`;

// forgot password email with reset link and otp
exports.forgotPwdTemplate = ({
  name = "Friend",
  resetLink,
  otp,
}) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}">Password reset request</h2>
    </div>
    <div style="${bodyStyle}">
      <p>Hello ${name},</p>
      <p>You asked to reset your password. Click the button below to open the reset page, then enter the six‑digit code.</p>
      <a href="${resetLink}" style="${buttonStyle}">Reset my password</a>
      <p style="margin-top:20px;">Or paste this OTP manually: <strong>${otp}</strong></p>
      ${footer}
    </div>
  </div>
</div>
`;

// expert welcome email with login credentials
exports.expertWelcomeTemplate = ({
  name = "Expert",
  email,
  password
}) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <div style="${headerStyle}">
      <h2 style="${titleStyle}">Welcome to the Expert Panel</h2>
    </div>
    <div style="${bodyStyle}">
      <p>Hello ${name},</p>
      <p>Your expert account has been created. Please use the credentials below to log in:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>We recommend changing your password after your first login.</p>
      <a href="{{APP_URL}}/login" style="${buttonStyle}">Login to Dashboard</a>
      ${footer}
    </div>
  </div>
</div>
`;