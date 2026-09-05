const nodemailer = require('nodemailer');
const { randomInt } = require('crypto');

// Check if development mode is enabled (for testing without email)
const DEVELOPMENT_MODE = process.env.DEVELOPMENT_MODE === 'true';

const getEmailConfig = () => {
  const emailService = process.env.EMAIL_SERVICE;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailSecure = process.env.EMAIL_SECURE === 'true';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  const isServiceConfigured = emailService && !emailService.includes('<your');
  const isHostConfigured = emailHost && emailPort;

  if (!emailUser || !emailPassword) {
    throw new Error(
      'Email credentials are not configured. Set EMAIL_USER and EMAIL_PASSWORD in backend/.env.'
    );
  }

  if (!isServiceConfigured && !isHostConfigured) {
    throw new Error(
      'Email transport is not configured. Set EMAIL_SERVICE in backend/.env, or set EMAIL_HOST and EMAIL_PORT.'
    );
  }

  return { emailService, emailHost, emailPort, emailSecure, emailUser, emailPassword };
};

const createTransporter = () => {
  const { emailService, emailHost, emailPort, emailSecure, emailUser, emailPassword } = getEmailConfig();

  if (emailService && !emailService.includes('<your')) {
    return nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: Number(emailPort),
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });
};

// Generate random 6-digit OTP
const generateOTP = () => {
  return randomInt(100000, 1000000).toString();
};

// Calculate expiry time (2 minutes from now)
const getOTPExpiry = () => {
  return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  if (DEVELOPMENT_MODE) {
    console.log(`\n=== DEVELOPMENT OTP ===`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`=== End Development OTP ===\n`);
    return true;
  }

  try {
    const transporter = createTransporter();
    const { emailUser } = getEmailConfig();

    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'RevInsight - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to RevInsight!</h2>
          <p style="color: #666; font-size: 16px;">Your OTP for email verification is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 48px; font-weight: bold; letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #e74c3c; font-weight: bold;">⏱️ This OTP will expire in 2 minutes.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">RevInsight © 2026. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Fallback: log OTP to console so registration is not blocked
    // This allows testing even without 2FA/App Password
    console.log(`\n=== FALLBACK OTP (Email failed - ${error.code || error.message}) ===`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`=== End Fallback OTP ===\n`);
    if (error.message.includes('Email service is not configured')) {
      throw error;
    }
    // Don't throw - return success so registerRequest can continue
    // User can verify using OTP from console
    return true;
  }
};

// Verify OTP
const verifyOTP = (storedOTP, providedOTP, expiresAt) => {
  // Check if OTP has expired
  if (new Date() > expiresAt) {
    return {
      isValid: false,
      message: 'OTP has expired. Please request a new one.'
    };
  }

  // Check if OTP matches
  if (storedOTP !== providedOTP) {
    return {
      isValid: false,
      message: 'Invalid OTP. Please try again.'
    };
  }

  return {
    isValid: true,
    message: 'OTP verified successfully'
  };
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
  verifyOTP
};