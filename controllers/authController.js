const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendActivationEmail, isValidEmail } = require('../utils/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    // Validate email format and domain
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Generate activation code
    const activationCode = crypto.randomBytes(32).toString('hex');
    const activationCodeExpire = Date.now() + 10 * 24 * 60 * 60 * 1000; // 10 days

    // Create user (not verified yet)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      emailVerified: false,
      activationCode,
      activationCodeExpire,
    });

    // Send activation email asynchronously (don't block response)
    // Use setImmediate to send email in next event loop tick
    setImmediate(async () => {
      try {
        await sendActivationEmail(user.email, user.name, activationCode);
        console.log(`✅ Activation email sent successfully to ${user.email}`);
      } catch (emailError) {
        // Log detailed error but don't fail registration
        console.error('⚠️ Failed to send activation email:', emailError.message || emailError);
        console.error('   User account created but email not sent. User can request resend.');
      }
    });

    // Return success response immediately (don't wait for email)
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to activate your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user account
// @route   GET /api/auth/activate
// @access  Public
exports.activateAccount = async (req, res, next) => {
  try {
    let { email, code } = req.query;

    // Decode URL-encoded parameters
    if (email) email = decodeURIComponent(email);
    if (code) code = decodeURIComponent(code);

    // Remove any trailing slashes or whitespace
    if (code) code = code.trim().replace(/\/+$/, '');

    console.log('🔗 Activation request received:');
    console.log('  Email:', email);
    console.log('  Code length:', code ? code.length : 0);
    console.log('  Code (first 20 chars):', code ? code.substring(0, 20) : 'N/A');

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and activation code are required',
      });
    }

    // First, find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+activationCode +activationCodeExpire');

    if (!user) {
      console.log('❌ User not found:', email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'Invalid activation link - user not found',
      });
    }

    console.log('✅ User found:', user.email);
    console.log('  User activation code length:', user.activationCode ? user.activationCode.length : 0);
    console.log('  User activation code (first 20 chars):', user.activationCode ? user.activationCode.substring(0, 20) : 'N/A');
    console.log('  Code match:', user.activationCode === code);

    // Check if activation code matches
    if (!user.activationCode || user.activationCode !== code) {
      console.log('❌ Activation code mismatch');
      return res.status(400).json({
        success: false,
        message: 'Invalid activation link - code mismatch',
      });
    }

    // Check if activation code has expired
    if (user.activationCodeExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Activation link has expired. Please register again.',
      });
    }

    // Check if already activated
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already activated',
      });
    }

    // Activate account
    user.emailVerified = true;
    user.activationCode = undefined;
    user.activationCodeExpire = undefined;
    await user.save();

    // Redirect to login page (frontend will handle this)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?activated=true`);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend activation email
// @route   POST /api/auth/resend-activation
// @access  Public
exports.resendActivation = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+activationCode +activationCodeExpire'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already activated',
      });
    }

    // Generate new activation code
    const activationCode = crypto.randomBytes(32).toString('hex');
    const activationCodeExpire = Date.now() + 10 * 24 * 60 * 60 * 1000; // 10 days

    user.activationCode = activationCode;
    user.activationCodeExpire = activationCodeExpire;
    await user.save();

    // Send activation email asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await sendActivationEmail(user.email, user.name, activationCode);
        console.log(`✅ Resend activation email sent successfully to ${user.email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to resend activation email:', emailError);
      }
    });

    // Return success response immediately
    res.status(200).json({
      success: true,
      message: 'Activation email has been sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the activation link.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
