const Mechanic = require('../models/mechanic');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin creates mechanic account
const createMechanic = async (req, res) => {
    try {
    const { email, password, firstName, lastName, phoneNumber, specialization, yearsOfExperience, certifications } = req.body;

    // Check if mechanic exists (normalize email to match schema lowercase/trim)
    const normalizedEmail = email.toLowerCase().trim();
    const existingMechanic = await Mechanic.findOne({ email: normalizedEmail });
    if (existingMechanic) {
      return res.status(400).json({ message: 'Mechanic email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create mechanic
    const mechanic = await Mechanic.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      specialization,
      yearsOfExperience,
      certifications: certifications || [],
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Mechanic account created successfully',
      mechanic: {
        id: mechanic._id,
        email: mechanic.email,
        firstName: mechanic.firstName,
        lastName: mechanic.lastName,
        specialization: mechanic.specialization,
        yearsOfExperience: mechanic.yearsOfExperience
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mechanic login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find mechanic
    const mechanic = await Mechanic.findOne({ email }).select('+password');
    if (!mechanic) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, mechanic.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: mechanic._id, role: 'mechanic' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      mechanic: {
        id: mechanic._id,
        email: mechanic.email,
        firstName: mechanic.firstName,
        lastName: mechanic.lastName,
        specialization: mechanic.specialization
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get mechanic profile
const getProfile = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.user.userId);
    if (!mechanic) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    res.status(200).json({
      mechanic: {
        id: mechanic._id,
        email: mechanic.email,
        firstName: mechanic.firstName,
        lastName: mechanic.lastName,
        phoneNumber: mechanic.phoneNumber,
        specialization: mechanic.specialization,
        yearsOfExperience: mechanic.yearsOfExperience,
        certifications: mechanic.certifications,
        totalRepairs: mechanic.totalRepairs,
        averageRating: mechanic.averageRating,
        isActive: mechanic.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update mechanic profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, specialization, yearsOfExperience, certifications } = req.body;

    const mechanic = await Mechanic.findByIdAndUpdate(
      req.user.userId,
      {
        firstName,
        lastName,
        phoneNumber,
        specialization,
        yearsOfExperience,
        certifications
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      mechanic: {
        id: mechanic._id,
        email: mechanic.email,
        firstName: mechanic.firstName,
        lastName: mechanic.lastName,
        specialization: mechanic.specialization,
        yearsOfExperience: mechanic.yearsOfExperience,
        certifications: mechanic.certifications
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: list all mechanics (used by admin dashboard frontend to show persistent mechanics)
const listAllMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find().select('firstName lastName email specialization totalRepairs averageRating isActive createdBy');

    const formatted = mechanics.map(m => ({
      id: m._id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      specialization: m.specialization,
      totalRepairs: m.totalRepairs || 0,
      averageRating: m.averageRating || 0,
      isActive: m.isActive,
      createdBy: m.createdBy
    }));

    res.status(200).json({ mechanics: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete mechanic (admin)
const deleteMechanic = async (req, res) => {
  try {
    const mechanicId = req.params?.id || req.body?.id || req.query?.id;

    if (!mechanicId) {
      return res.status(400).json({ message: 'Mechanic id required' });
    }

    const deletedMechanic = await Mechanic.findByIdAndDelete(mechanicId);

    if (!deletedMechanic) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    return res.status(200).json({ message: 'Mechanic deleted successfully' });
  } catch (error) {
    console.error('[deleteMechanic] error', error);
    return res.status(500).json({ message: error.message });
  }
};

// Admin: update mechanic by id
const updateMechanic = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, specialization, yearsOfExperience, certifications, password } = req.body;

    const mechanic = await Mechanic.findById(id);
    if (!mechanic) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    // Prepare update fields
    const update = {
      firstName: firstName !== undefined ? firstName : mechanic.firstName,
      lastName: lastName !== undefined ? lastName : mechanic.lastName,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : mechanic.phoneNumber,
      specialization: specialization !== undefined ? specialization : mechanic.specialization,
      yearsOfExperience: yearsOfExperience !== undefined ? yearsOfExperience : mechanic.yearsOfExperience,
      certifications: certifications !== undefined ? certifications : mechanic.certifications
    };

    // If admin supplied a new password, hash it
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
      const hashed = await bcrypt.hash(password, 10);
      update.password = hashed;
    }

    const updated = await Mechanic.findByIdAndUpdate(id, update, { new: true, runValidators: true });

    res.status(200).json({ message: 'Mechanic updated successfully', mechanic: {
      id: updated._id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      specialization: updated.specialization,
      yearsOfExperience: updated.yearsOfExperience,
      certifications: updated.certifications
    }});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMechanic,
  login,
  getProfile,
  updateProfile,
  listAllMechanics,
  deleteMechanic,
  updateMechanic
};
