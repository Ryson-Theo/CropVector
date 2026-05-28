// backend/config/mail.js
const nodemailer = require('nodemailer');
require('dotenv').config({ debug: false, quiet: true });

// gmail setup
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// check if email connection works
transporter.verify((error, success) => {
  if (error) {
    // SMTP connection error
  } else {
    // SMTP connection successful
  }
});

const verifyTransporter = async () => {
  return new Promise((resolve, reject) => {
    transporter.verify((error, success) => {
      if (error) {
        reject(error);
      } else {
        resolve(success);
      }
    });
  });
};

// function to send emails
const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"CropVector" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });

    return info;

  } catch (error) {
    throw error;
  }
};

module.exports = { sendMail, verifyTransporter };
