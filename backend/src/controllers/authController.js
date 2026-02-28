const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Email validation ──
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Only allow real email providers (not disposable)
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'icloud.com', 'aol.com', 'zoho.com', 'mail.com', 'yandex.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
      return res.status(400).json({ 
        error: 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)',
      });
    }

    // ── Password strength validation using validator.isStrongPassword ──
    if (!password || !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 3,
      minSymbols: 1,
    })) {
      return res.status(400).json({
        error: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 3 numbers, and 1 special character',
      });
    }

    // ── Name validation ──
    if (!name || !validator.isLength(name, { min: 2, max: 50 })) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const allowedRole = ['patient', 'doctor'].includes(role) ? role : 'patient';

    const user = await User.create({
      name: validator.escape(name.trim()),
      email: validator.normalizeEmail(email),
      passwordHash: password,
      role: allowedRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' });
    }

    const user = await User.findOne({ email: validator.normalizeEmail(email) }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        avatar: user.avatar,
        phone: user.phone,
        specialization: user.specialization,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, specialization, avatar } = req.body;
    const updates = {};
    if (name) updates.name = validator.escape(name.trim());
    if (phone) updates.phone = phone;
    if (specialization && req.user.role === 'doctor') updates.specialization = specialization;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
