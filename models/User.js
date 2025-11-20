const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required if using Google OAuth
    },
    minlength: 6,
    select: false,
  },
  googleId: {
    type: String,
    select: false,
    sparse: true, // Allows multiple null values
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  phone: {
    type: String,
    trim: true,
  },
  homeAddress: {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  shippingAddress: {
    type: [{
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    }],
    default: [],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  emailVerified: {
    type: Boolean,
    default: function() {
      return this.provider === 'google'; // Google accounts are pre-verified
    },
  },
  activationCode: {
    type: String,
    select: false,
  },
  activationCodeExpire: {
    type: Date,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better query performance
UserSchema.index({ email: 1 }); // Already unique, but explicit index
UserSchema.index({ emailVerified: 1 }); // For querying unverified users
UserSchema.index({ createdAt: -1 }); // For sorting by creation date

// Encrypt password using bcrypt (only for local accounts)
UserSchema.pre('save', async function (next) {
  // Skip password hashing for Google OAuth users
  if (this.provider === 'google' || !this.password) {
    return next();
  }

  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

