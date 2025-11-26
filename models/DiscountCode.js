const mongoose = require('mongoose');

const DiscountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a discount code'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'],
    minlength: [3, 'Code must be at least 3 characters'],
    maxlength: [20, 'Code cannot exceed 20 characters'],
  },
  description: {
    type: String,
    trim: true,
  },
  // Discount type: 'percentage' or 'fixed'
  discountType: {
    type: String,
    required: [true, 'Please specify discount type'],
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  // Discount value: percentage (0-100) or fixed amount
  discountValue: {
    type: Number,
    required: [true, 'Please add discount value'],
    min: [0, 'Discount value cannot be negative'],
  },
  // Minimum purchase amount to use this code
  minPurchase: {
    type: Number,
    min: [0, 'Minimum purchase cannot be negative'],
    default: 0,
  },
  // Maximum discount amount (for percentage discounts)
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative'],
    default: null,
  },
  // Validity period
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validTo: {
    type: Date,
    required: [true, 'Please specify expiration date'],
  },
  // Usage limits
  usageLimit: {
    type: Number,
    min: [0, 'Usage limit cannot be negative'],
    default: null, // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // One-time use per user
  oneTimeUse: {
    type: Boolean,
    default: false,
  },
  // Applicable categories (empty array means all categories)
  applicableCategories: {
    type: [String],
    enum: ['roses', 'tulips', 'lilies', 'sunflowers', 'orchids', 'carnations', 'mixed', 'other'],
    default: [],
  },
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to validate discount value based on type
DiscountCodeSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  if (this.validTo && this.validTo < this.validFrom) {
    return next(new Error('Expiration date must be after start date'));
  }
  this.updatedAt = Date.now();
  next();
});

// Method to check if code is valid
DiscountCodeSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    this.validFrom <= now &&
    this.validTo >= now &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// Method to calculate discount amount
DiscountCodeSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.isValid()) {
    return { discount: 0, error: 'Discount code is not valid' };
  }

  if (subtotal < this.minPurchase) {
    return {
      discount: 0,
      error: `Minimum purchase of $${this.minPurchase} required`,
    };
  }

  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
    // Apply maximum discount limit if set
    if (this.maxDiscount !== null && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed amount
    discount = this.discountValue;
    // Don't exceed subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }
  }

  return {
    discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
    finalAmount: Math.round((subtotal - discount) * 100) / 100,
  };
};

// Add indexes for better query performance
DiscountCodeSchema.index({ code: 1 }); // Unique index for code lookup
DiscountCodeSchema.index({ isActive: 1, validFrom: 1, validTo: 1 }); // For active code queries
DiscountCodeSchema.index({ createdAt: -1 }); // For sorting

module.exports = mongoose.model('DiscountCode', DiscountCodeSchema);

