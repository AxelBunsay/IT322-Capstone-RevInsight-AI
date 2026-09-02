const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, getOTPExpiry, sendOTPEmail, verifyOTP } = require('../../utils/otpService');

// Step 1: Register Request - Send OTP to email
const registerRequest = async (req, res) => {
  
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    // Send OTP to email
    await sendOTPEmail(email, otp);

    // Store OTP temporarily in database (without creating full account yet)
    // Create a temporary user document with unverified email
    let tempUser = await User.findOne({ email });
    
    if (!tempUser) {
      // Hash password for temporary storage
      const hashedPassword = await bcrypt.hash(password, 10);
      
      tempUser = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        isEmailVerified: false,
        otp: {
          code: otp,
          expiresAt: expiresAt
        }
      });
    } else {
      // Update existing temporary user with new OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      tempUser.password = hashedPassword;
      tempUser.firstName = firstName;
      tempUser.lastName = lastName;
      tempUser.phoneNumber = phoneNumber;
      tempUser.otp = {
        code: otp,
        expiresAt: expiresAt
      };
    }

    await tempUser.save();

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      expiresIn: '2 minutes',
      email: email
    });
  } catch (error) {
    console.error('[registerRequest] error', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// Step 2: Verify OTP - Create account after verification
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user with pending OTP
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Verify OTP
    const verification = verifyOTP(user.otp.code, otp, user.otp.expiresAt);
    
    if (!verification.isValid) {
      return res.status(400).json({ message: verification.message });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.otp = {
      code: null,
      expiresAt: null
    };
    
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'Email verified successfully. Account created!',
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
    console.error('[verifyOtp] error', error);
    res.status(500).json({ message: 'Failed to verify OTP. Please try again.' });
  }
};

// Resend OTP - for expired or lost OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    // Send OTP to email
    await sendOTPEmail(email, otp);

    // Update OTP in database
    user.otp = {
      code: otp,
      expiresAt: expiresAt
    };

    await user.save();

    res.status(200).json({
      message: 'OTP resent to your email',
      expiresIn: '2 minutes',
      email: email
    });
  } catch (error) {
    console.error('[resendOtp] error', error);
    res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
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
