const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendActivationEmail, sendResetPasswordEmail, isValidEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      provider: 'local',
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

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
    }

    // Verify Google ID token
    let ticket;
    try {
      // Log token type for debugging
      console.log('🔍 Received token type:', idToken.startsWith('ya29.') ? 'Access Token (❌ Wrong)' : idToken.startsWith('eyJ') ? 'ID Token (✅ Correct)' : 'Unknown format');
      console.log('🔍 Token preview:', idToken.substring(0, 50) + '...');
      
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      console.log('✅ Token verified successfully');
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      // Provide more detailed error message
      if (idToken.startsWith('ya29.')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token type: Access Token received. Please use ID Token (credential) instead. Check frontend implementation.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Invalid Google token: ${error.message}`,
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists with this email or Google ID
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { googleId: googleId },
      ],
    });

    if (user) {
      // User exists - update Google ID and provider if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      
      // Set provider: if user has password, allow both local and google
      // Otherwise, set to google
      if (!user.password) {
        user.provider = 'google';
      } else if (user.provider === 'local') {
        // Keep as local but allow Google login too
        // User can login with either method
      }

      // Google accounts are always verified
      user.emailVerified = true;
      await user.save();
    } else {
      // Create new user with Google account
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        provider: 'google',
        emailVerified: true, // Google accounts are pre-verified
        // No password required for Google OAuth users
      });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
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

    // Check if user is using Google OAuth (no password)
    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google login. Please use Google sign-in instead.',
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
      homeAddress: req.body.homeAddress,
      shippingAddress: req.body.shippingAddress,
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

// @desc    Request password reset
// @route   POST /api/auth/request-reset
// @access  Public
exports.requestReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    console.log(`🔍 Password reset request for email: ${email.toLowerCase()}`);
    console.log(`   User found: ${user ? 'Yes' : 'No'}`);
    if (user) {
      console.log(`   User provider: ${user.provider}`);
      console.log(`   User email verified: ${user.emailVerified}`);
    }

    // Always return success message (for security - don't reveal if email exists)
    // But only send email if user exists and is not a Google OAuth user
    if (user && user.provider === 'local') {
      // Generate reset code
      const resetCode = crypto.randomBytes(32).toString('hex');
      const resetCodeExpire = Date.now() + 60 * 60 * 1000; // 1 hour

      console.log(`📝 Generated reset code for user: ${user.email}`);
      console.log(`   Reset code expires at: ${new Date(resetCodeExpire).toISOString()}`);

      // Save reset code to user
      user.resetCode = resetCode;
      user.resetCodeExpire = resetCodeExpire;
      await user.save();

      console.log(`💾 Reset code saved to database`);

      // Send reset password email asynchronously (don't block response)
      setImmediate(async () => {
        try {
          console.log(`📧 Attempting to send reset password email to: ${user.email}`);
          await sendResetPasswordEmail(user.email, user.name, resetCode);
          console.log(`✅ Reset password email sent successfully to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send reset password email:');
          console.error('   Error:', emailError.message || emailError);
          console.error('   Stack:', emailError.stack);
        }
      });
    } else {
      if (!user) {
        console.log(`⚠️ User not found for email: ${email.toLowerCase()}`);
      } else if (user.provider !== 'local') {
        console.log(`⚠️ User is Google OAuth user, cannot reset password via email`);
      }
    }

    // Always return success (security best practice - don't reveal if email exists)
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password, resetCode } = req.body;

    if (!email || !password || !resetCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and reset code are required',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Find user with reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+resetCode +resetCodeExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset link',
      });
    }

    // Check if reset code matches
    if (!user.resetCode || user.resetCode !== resetCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code',
      });
    }

    // Check if reset code has expired
    if (!user.resetCodeExpire || user.resetCodeExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.',
      });
    }

    // Check if user is Google OAuth user
    if (user.provider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset password for Google account. Please use Google sign-in.',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
