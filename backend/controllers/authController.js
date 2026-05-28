// backend/controllers/authController.js
const User   = require('../models/User');
const Farmer = require('../models/Farmer');
const Buyer  = require('../models/Buyer');
const Expert = require('../models/Expert');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const TempUser = require('../models/TempUser');
const Contact = require('../models/Contact');

// import for sending emails and otp
const { sendMail } = require('../config/mail');
const { storeOtp, verifyOtp } = require('../utils/otp');
const {
  otpTemplate,
  welcomeTemplate,
  approvalTemplate,
  rejectionTemplate,
  loginNotifyTemplate,
  forgotPwdTemplate,
  passwordChangedTemplate,
  emailChangedTemplate,
} = require('../utils/mailTemplates');

// register or sync user
exports.register = async (req, res) => {
  try {
    const {
      fullName, email, password, role, phone, place,
      address, firebaseUid, profilePic, businessType,
      specialization, experience,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // if user exists, just sync firebase id
    if (user) {
      if (!user.firebaseUid && firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
      }
      return res.status(200).json({
        message: 'User sync successful',
        status: user.status,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      });
    }

    // make a new user
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Handle profile picture upload (multer)
    let finalProfilePic = null;
    if (req.files && req.files['profilePic']) {
      finalProfilePic = req.files['profilePic'][0].path;
    } else if (profilePic) {
      finalProfilePic = profilePic;
    }

    const finalRole = role || 'user';
    const initialStatus =
      finalRole === 'farmer' || finalRole === 'expert' ? 'pending' : 'approved';

    user = new User({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: finalRole,
      firebaseUid,
      status: initialStatus,
      profilePic: finalProfilePic,
    });

    const savedUser = await user.save();

    // create the role-specific data
    if (finalRole === 'farmer') {
      await new Farmer({
        userId: savedUser._id,
        phone,
        place,
        address,
        license:
          req.files && req.files['license']
            ? req.files['license'][0].path
            : null,
      }).save();
    } else if (finalRole === 'buyer') {
      await new Buyer({
        userId: savedUser._id,
        phone,
        place,
        address,
        businessType: businessType || 'Individual',
        license:
          req.files && (req.files['license'] || req.files['qualification'])
            ? (req.files['license'] || req.files['qualification'])[0].path
            : null,
      }).save();
    } else if (finalRole === 'expert') {
      const expertDoc =
        req.files && (req.files['qualification'] || req.files['license'])
          ? (req.files['qualification'] || req.files['license'])[0].path
          : null;

      await new Expert({
        userId: savedUser._id,
        phone,
        specialization,
        experience,
        address,
        license: expertDoc,
      }).save();
    }

    res.status(201).json({
      message: 'User registered successfully',
      status: user.status,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// login with email and password
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

   // If password is missing (corrupted user), block login safely
if (!user.password) {
  return res.status(400).json({ message: 'Invalid credentials' });
}

const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  return res.status(400).json({ message: 'Invalid credentials' });
}


    // Block pending farmer / expert
    if (
      (user.role === 'farmer' || user.role === 'expert') &&
      user.status === 'pending'
    ) {
      return res.status(403).json({
        message: 'Account pending admin approval',
        status: 'pending',
        role: user.role,
      });
    }

    // send login notification email
    await sendMail({
      to: user.email,
      subject: 'New sign‑in to your CropVector account',
      html: loginNotifyTemplate({
        name: user.fullName,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        time: new Date().toLocaleString(),
      }),
    }).catch(() => {});

    // send welcome email on first approval
    if (user.status === 'approved' && !user.welcomeSent) {
      await sendMail({
        to: user.email,
        subject: 'Welcome to CropVector – Getting Started',
        html: welcomeTemplate({ name: user.fullName, role: user.role }),
      }).catch(() => {});

      user.welcomeSent = true;
      await user.save();
    }

    // create jwt token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    // Resolve role‑specific IDs
    let roleSpecificId = null;
    if (user.role === 'farmer') {
      const farmer = await Farmer.findOne({ userId: user._id });
      roleSpecificId = farmer ? farmer._id : null;
    } else if (user.role === 'buyer') {
      const buyer = await Buyer.findOne({ userId: user._id });
      roleSpecificId = buyer ? buyer._id : null;
    } else if (user.role === 'expert') {
      const expert = await Expert.findOne({ userId: user._id });
      roleSpecificId = expert ? expert._id : null;
    }

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        email: user.email,
        farmerId: roleSpecificId,
        roleSpecificId,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// login using firebase
exports.loginWithFirebase = async (req, res) => {
  const { firebaseUid } = req.body;
  try {
    const user = await User.findOne({ firebaseUid });

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (
      (user.role === 'farmer' || user.role === 'expert') &&
      user.status === 'pending'
    ) {
      return res.status(403).json({
        message: 'Account pending admin approval',
        status: 'pending',
        role: user.role,
      });
    }

    await sendMail({
      to: user.email,
      subject: 'New sign‑in to your CropVector account',
      html: loginNotifyTemplate({
        name: user.fullName,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        time: new Date().toLocaleString(),
      }),
    }).catch(() => {});

    // send welcome email first time
    if (user.status === 'approved' && !user.welcomeSent) {
      await sendMail({
        to: user.email,
        subject: 'Welcome to CropVector – Getting Started',
        html: welcomeTemplate({ name: user.fullName }),
      }).catch(() => {});

      user.welcomeSent = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    // Resolve role‑specific IDs
    let roleSpecificId = null;
    if (user.role === 'farmer') {
      const farmer = await Farmer.findOne({ userId: user._id });
      roleSpecificId = farmer ? farmer._id : null;
    } else if (user.role === 'buyer') {
      const buyer = await Buyer.findOne({ userId: user._id });
      roleSpecificId = buyer ? buyer._id : null;
    } else if (user.role === 'expert') {
      const expert = await Expert.findOne({ userId: user._id });
      roleSpecificId = expert ? expert._id : null;
    }

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        email: user.email,
        farmerId: roleSpecificId,
        roleSpecificId,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get user profile info
exports.getProfile = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let roleData = null;
    if (user.role === 'farmer') roleData = await Farmer.findOne({ userId: user._id });
    else if (user.role === 'buyer') roleData = await Buyer.findOne({ userId: user._id });
    else if (user.role === 'expert') roleData = await Expert.findOne({ userId: user._id });

    res.status(200).json({ ...user._doc, details: roleData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      place,
      address,
      email,
      businessType,
      specialization,
      experience,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update base fields
    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    user.place = place || user.place;
    user.address = address || user.address;

    if (req.files && req.files['profilePic']) {
      user.profilePic = req.files['profilePic'][0].path;
    }
    await user.save();

    const updateData = { phone, place, address };
    const fileLicense =
      req.files && (req.files['license'] || req.files['qualification'])
        ? (req.files['license'] || req.files['qualification'])[0].path
        : null;

    if (user.role === 'farmer') {
      await Farmer.findOneAndUpdate(
        { userId: user._id },
        { ...updateData, ...(fileLicense && { license: fileLicense }) },
        { upsert: true }
      );
    } else if (user.role === 'buyer') {
      await Buyer.findOneAndUpdate(
        { userId: user._id },
        { ...updateData, businessType, ...(fileLicense && { license: fileLicense }) },
        { upsert: true }
      );
    } else if (user.role === 'expert') {
      await Expert.findOneAndUpdate(
        { userId: user._id },
        {
          phone,
          place,
          specialization,
          experience,
          address,
          ...(fileLicense && { license: fileLicense }),
        },
        { upsert: true }
      );
    }

    // Fetch updated role data
    let updatedRoleData = null;
    if (user.role === 'farmer') updatedRoleData = await Farmer.findOne({ userId: user._id });
    else if (user.role === 'buyer') updatedRoleData = await Buyer.findOne({ userId: user._id });
    else if (user.role === 'expert') updatedRoleData = await Expert.findOne({ userId: user._id });

    res.status(200).json({ message: 'Profile updated', user, details: updatedRoleData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// request otp for registration or password reset
exports.requestOtp = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      phone,
      place,
      address,
      firebaseUid,
      businessType,
      specialization,
      experience,
    } = req.body;

    if (!email) return res.status(400).json({ message: 'Email required' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check already existing permanent user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: 'Email already registered' });

    // Remove old temp if exists
    await TempUser.deleteOne({ email: normalizedEmail });

    const { rawOtp } = await storeOtp(normalizedEmail);

    const tempUser = new TempUser({
      fullName,
      email: normalizedEmail,
      password,
      role,
      phone,
      place,
      address,
      firebaseUid,
      businessType,
      specialization,
      experience,
      profilePic:
        req.files && req.files['profilePic']
          ? req.files['profilePic'][0].path
          : null,
      license:
        req.files && req.files['license']
          ? req.files['license'][0].path
          : null,
      qualification:
        req.files && req.files['qualification']
          ? req.files['qualification'][0].path
          : null,
    });

    await tempUser.save();

    await sendMail({
      to: email,
      subject: 'Your CropVector verification code',
      html: otpTemplate({ name: fullName, otp: rawOtp, expiry: 10 }),
    });

    res.json({ message: 'OTP sent successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Failed to process registration' });
  }
};


// -----------------------------------------------------------------
// 2️⃣ VERIFY OTP
// -----------------------------------------------------------------
 // verify otp to finish registration
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: 'Email & OTP required' });

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const valid = await verifyOtp(normalizedEmail, otp);
    if (!valid)
      return res.status(401).json({ message: 'Invalid or expired OTP' });

    const tempUser = await TempUser.findOne({ email: normalizedEmail });
    if (!tempUser)
      return res.status(400).json({ message: 'No pending registration found' });

    // Hash password
    let hashedPassword = null;
    if (tempUser.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(tempUser.password, salt);
    }

    const initialStatus =
      tempUser.role === 'farmer' || tempUser.role === 'expert'
        ? 'pending'
        : 'approved';

    const newUser = await new User({
      fullName: tempUser.fullName,
      email: tempUser.email,
      password: hashedPassword,
      role: tempUser.role,
      firebaseUid: tempUser.firebaseUid,
      status: initialStatus,
      profilePic: tempUser.profilePic,
    }).save();

    // create role-specific data
    if (tempUser.role === 'farmer') {
      await new Farmer({
        userId: newUser._id,
        phone: tempUser.phone,
        place: tempUser.place,
        address: tempUser.address,
        license: tempUser.license,
      }).save();
    } else if (tempUser.role === 'buyer') {
      await new Buyer({
        userId: newUser._id,
        phone: tempUser.phone,
        place: tempUser.place,
        address: tempUser.address,
        businessType: tempUser.businessType,
      }).save();
    } else if (tempUser.role === 'expert') {
      await new Expert({
        userId: newUser._id,
        phone: tempUser.phone,
        specialization: tempUser.specialization,
        experience: tempUser.experience,
        address: tempUser.address,
        license: tempUser.qualification || tempUser.license,
      }).save();
    }

    // delete temp user
    await TempUser.deleteOne({ email: normalizedEmail });

    res.json({
      message: 'Registration completed successfully',
      role: newUser.role,
      status: newUser.status,
    });

  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};


// -----------------------------------------------------------------
// 3️⃣ FORGOT PASSWORD – send reset link + OTP
// -----------------------------------------------------------------
exports.forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { rawOtp } = await storeOtp(normalizedEmail);

    const resetToken = jwt.sign(
      { email: normalizedEmail },
      process.env.JWT_SECRET || 'tmp_secret',
      { expiresIn: '15m' }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(
      email
    )}&token=${resetToken}`;

    await sendMail({
      to: email,
      subject: 'CropVector password reset',
      html: forgotPwdTemplate({ name: user.fullName, resetLink, otp: rawOtp }),
    });

    res.json({ message: 'Reset instructions sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process request' });
  }
};

// reset password - verify otp and token, then set new password
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, token, otp, newPassword } = req.body;
  if (!email || !token || !otp || !newPassword) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    // Verify the short‑lived JWT first
    jwt.verify(token, process.env.JWT_SECRET || 'tmp_secret');

    // Verify OTP
    const ok = await verifyOtp(normalizedEmail, otp);
    if (!ok) return res.status(401).json({ message: 'Invalid or expired OTP' });

    // Update password hash
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await User.findOneAndUpdate({ email: normalizedEmail }, { password: hashed });

    res.json({ message: 'Password updated – you can now log in' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// user settings
// generic otp generation
exports.generateOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // For password-change host email, we need account to exist.
    // For email-change destination, it may not exist yet.
    if (!user) {
    }

    const { rawOtp } = await storeOtp(normalizedEmail);

    // Send OTP email
    await sendMail({
      to: normalizedEmail,
      subject: 'Your CropVector Verification Code',
      html: otpTemplate({ name: user?.fullName || 'CropVector User', otp: rawOtp, expiry: 10 }),
    });

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};

// Generic OTP Verification
exports.verifyGenericOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const isValid = await verifyOtp(normalizedEmail, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Generate a temporary token to prove OTP was verified
    const otpToken = jwt.sign(
      { email: normalizedEmail, purpose: 'otp-verified' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '15m' }
    );

    res.status(200).json({ message: 'OTP verified successfully.', otpToken });
  } catch (error) {
    res.status(500).json({ message: 'OTP verification failed.' });
  }
};

// Reset Password (from settings page, using OTP)
exports.resetPasswordFromSettings = async (req, res) => {
  const { email, otp, password, otpToken } = req.body;
  if (!email || !password || (!otp && !otpToken)) {
    return res.status(400).json({ message: 'Email, password, and verification are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Verify OTP or Token
    if (otpToken) {
      try {
        const decoded = jwt.verify(otpToken, process.env.JWT_SECRET || 'your_jwt_secret');
        if (decoded.email !== normalizedEmail || decoded.purpose !== 'otp-verified') {
          throw new Error('Invalid token');
        }
      } catch (e) {
        return res.status(400).json({ message: 'Verification session expired. Please request a new OTP.' });
      }
    } else {
      const isValid = await verifyOtp(normalizedEmail, otp);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
      }
    }

    // 2. Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 3. Hash new password and update directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Update user directly using email filter to ensure match
    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { password: hashedPassword } },
      { returnDocument: 'after' } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update password in database.' });
    }
    // 4. Send confirmation email
    const passwordChangedHtml = `<p>Hello ${user.fullName},</p><p>Your password for CropVector was changed successfully. If you did not make this change, please contact support immediately.</p>`;
    await sendMail({
      to: email,
      subject: 'Your CropVector Password Has Been Changed',
      html: passwordChangedHtml,
    }).catch(() => {});

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};

// Verify Current Password (for email change)
exports.verifyPassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password.' });
    }

    res.status(200).json({ message: 'Password verified.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during password verification.' });
  }
};

// Update Email Address
exports.updateEmail = async (req, res) => {
  const { oldEmail, newEmail, otp } = req.body;
  if (!oldEmail || !newEmail || !otp) {
    return res.status(400).json({ message: 'Old email, new email, and OTP are required.' });
  }

  try {
    // 1. Check if new email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'This email address is already in use.' });
    }

    // 2. Verify the OTP for the NEW email address
    const isValid = await verifyOtp(newEmail.toLowerCase(), otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP for the new email.' });
    }

    // 3. Find the user by old email and update it
    const user = await User.findOne({ email: oldEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Original user account not found.' });
    }

    const originalEmail = user.email;
    user.email = newEmail.toLowerCase();
    await user.save();

    // 4. Send notification emails
    const emailChangedHtmlOld = `<p>Hello ${user.fullName},</p><p>Your email address for CropVector has been changed from ${originalEmail} to ${user.email}. If you did not make this change, please contact support immediately.</p>`;
    const emailChangedHtmlNew = `<p>Hello ${user.fullName},</p><p>Your email address for CropVector has been successfully updated to ${user.email}.</p>`;
    
    await Promise.all([
      sendMail({ to: originalEmail, subject: 'Security Alert: Your CropVector Email Was Changed', html: emailChangedHtmlOld }),
      sendMail({ to: user.email, subject: 'Your CropVector Email Has Been Updated', html: emailChangedHtmlNew })
    ]);

    // 5. Generate a new token for the frontend to use
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });

    res.status(200).json({ message: 'Email updated successfully.', token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update email address.' });
  }
};

// -----------------------------------------------------------------
// CONTACT FORM
// -----------------------------------------------------------------
exports.contactUs = async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    // 1. Save to Database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // Send email to admin
    await sendMail({
      to: process.env.ADMIN_EMAIL || 'admin@cropvector.com',
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    
    // Auto-reply to user
    await sendMail({
      to: email,
      subject: 'We received your message - CropVector',
      html: `<p>Hi ${name},</p><p>Thanks for reaching out. We have received your message regarding "${subject}" and will get back to you shortly.</p><br><p>Best regards,</p><p>CropVector Team</p>`
    });

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
};
