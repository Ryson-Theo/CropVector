// generate and verify otp codes
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OtpModel = require('../models/Otp');

const OTP_LENGTH   = 6;   // 6 digit code
const EXPIRY_MIN   = 10;  // expires after this many minutes
const SALT_ROUNDS  = 12;

// create a random 6 digit otp
const generateRawOtp = () => {
  const min = Math.pow(10, OTP_LENGTH - 1); // 100000
  const max = Math.pow(10, OTP_LENGTH) - 1; // 999999
  return String(crypto.randomInt(min, max + 1));
};

// save otp to database and return it
const storeOtp = async (email) => {
  const rawOtp   = generateRawOtp();
  const otpHash  = await bcrypt.hash(rawOtp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + EXPIRY_MIN * 60_000);

  await OtpModel.findOneAndUpdate(
    { email },
    { otpHash, expiresAt, used: false },
    { upsert: true, returnDocument: 'after' }
  );

  return { rawOtp };
};

/**
 * Verify a supplied OTP.
 * Returns true if it matches and isn’t expired/used.
 */
const verifyOtp = async (email, suppliedOtp) => {
  const record = await OtpModel.findOne({ email, used: false });
  if (!record) return false;
  if (record.expiresAt < new Date()) return false; // expired

  const match = await bcrypt.compare(suppliedOtp, record.otpHash);
  if (match) {
    record.used = true;
    await record.save();
  }
  return match;
};

module.exports = { generateRawOtp, storeOtp, verifyOtp };