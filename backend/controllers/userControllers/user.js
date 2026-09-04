const User = require('../../models/user');
const PendingUser = require('../../models/pendingUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


const sendVerificationEmail = async (user, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify your email',
    text: `
      Hello ${user.firstName},
      Your RevInsight verification code is: ${otp}
      This will expire in 10 minutes.
    `,
    html: `
      <div style="
        width: 100%;
        margin: 0;
        padding: 24px 12px;
        background-color: #f4f7fa;
        font-family: Arial, Helvetica, sans-serif;
        box-sizing: border-box;
      ">
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width: 520px; margin: 0 auto;"
        >
          <tr>
            <td style="
              background-color: #F57627;
              padding: 28px 20px;
              text-align: center;
            ">
            </td>
          </tr>

          <tr>
            <td style="
              padding: 36px 24px;
              background-color: #ffffff;
              text-align: center;
            ">
              <h1 style="
                margin: 0 0 16px;
                color: #17202a;
                font-size: 26px;
                line-height: 1.2;
              ">
                Verify your email
              </h1>

              <p style="
                margin: 0 0 14px;
                color: #52616b;
                font-size: 16px;
                line-height: 1.6;
              ">
                Hello ${user.firstName},
              </p>

              <p style="
                margin: 0 auto 26px;
                max-width: 380px;
                color: #52616b;
                font-size: 15px;
                line-height: 1.6;
              ">
                Use the verification code below to complete your RevInsight account registration.
              </p>

              <div style="
                display: inline-block;
                max-width: 100%;
                padding: 18px 22px;
                background-color: #e8f4f7;
                border: 1px solid #b9dce5;
                border-radius: 8px;
                box-sizing: border-box;
              ">
                <span style="
                  color: #000000;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 7px;
                ">
                  ${otp}
                </span>
              </div>

              <p style="
                margin: 26px 0 0;
                color: #687780;
                font-size: 14px;
                line-height: 1.5;
              ">
                This code will expire in <strong>10 minutes</strong>.
              </p>

              <p style="
                margin: 20px 0 0;
                color: #8a99a8;
                font-size: 13px;
                line-height: 1.5;
              ">
                If you did not request this verification code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="
              padding: 18px 20px;
              background-color: #f8fafb;
              text-align: center;
            ">
              <p style="
                margin: 0;
                color: #8a99a8;
                font-size: 12px;
              ">
                RevInsight Support
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  });
};

// Step 1: Register Request - Send OTP to email
const registerRequest = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already in use'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationOtp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const verificationOtpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const pendingUser = await PendingUser.findOneAndUpdate(
      { email },
      {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        otp: {
          code: verificationOtp,
          expiresAt: verificationOtpExpiry
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    await sendVerificationEmail(pendingUser, verificationOtp);

    return res.status(202).json({
      message: 'Registration pending. OTP sent to your email.',
      email
    });
  } catch (error) {
    console.error('[registerRequest] error:', error);

    return res.status(500).json({
      message: 'Failed to register user',
      error: error.message
    });
  }
};


// Step 2: Verify OTP - Create account after verification
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pendingUser = await PendingUser
      .findOne({ email })
      .select('+password');

    if (!pendingUser) {
      return res.status(404).json({
        message: 'Registration not found or expired.'
      });
    }

    if (new Date() > pendingUser.otp.expiresAt) {
      await PendingUser.deleteOne({ _id: pendingUser._id });

      return res.status(400).json({
        message: 'OTP has expired. Please register again.'
      });
    }

    if (pendingUser.otp.code !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP.'
      });
    }

    const user = await User.create({
      email: pendingUser.email,
      password: pendingUser.password,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      phoneNumber: pendingUser.phoneNumber,
      isEmailVerified: true
    });

    await PendingUser.deleteOne({ _id: pendingUser._id });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Email verified successfully. Account created.',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[verifyOtp] error:', error);

    return res.status(500).json({
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

// Resend OTP - for expired or lost OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const pendingUser = await PendingUser.findOne({ email });

    if (!pendingUser) {
      return res.status(404).json({
        message: 'Registration not found or expired.'
      });
    }

    if (!pendingUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (pendingUser.isEmailVerified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    const newOtp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const newOtpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    pendingUser.otp = {
      code: newOtp,
      expiresAt: newOtpExpiry
    };

    await pendingUser.save();
    await sendVerificationEmail(pendingUser, newOtp);

    return res.status(200).json({
      message: 'A new OTP was sent to your email.',
      email: pendingUser.email
    });
  } catch (error) {
    console.error('[resendOtp] error:', error);

    return res.status(500).json({
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
};

// Login (unchanged - only for verified users)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('[login] error', error);
    res.status(500).json({ message: 'Failed to login. Please try again.' });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        preferences: user.preferences,
        totalPurchases: user.totalPurchases,
        totalSpent: user.totalSpent,
        firstPurchaseDate: user.firstPurchaseDate,
        lastPurchaseDate: user.lastPurchaseDate
      }
    });
  } catch (error) {
    console.error('[getProfile] error', error);
    res.status(500).json({ message: 'Failed to load profile. Please try again.' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, preferences } = req.body;
    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
        ...(preferences && { preferences })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('[updateProfile] error', error);
    res.status(500).json({ message: 'Failed to update profile. Please try again.' });
  }
};

// Get purchase history
const getPurchaseHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      totalPurchases: user.totalPurchases,
      totalSpent: user.totalSpent,
      firstPurchaseDate: user.firstPurchaseDate,
      lastPurchaseDate: user.lastPurchaseDate
    });
  } catch (error) {
    console.error('[getPurchaseHistory] error', error);
    res.status(500).json({ message: 'Failed to load purchase history. Please try again.' });
  }
};

const getReceipts = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Receipts retrieved',
      lastReceiptDate: user.lastReceiptDate
    });
  } catch (error) {
    console.error('[getReceipts] error', error);
    res.status(500).json({ message: 'Failed to load receipts. Please try again.' });
  }
};

module.exports = {
  registerRequest,
  verifyOtp,
  resendOtp,
  login,
  getProfile,
  updateProfile,
  getPurchaseHistory,
  getReceipts
};
