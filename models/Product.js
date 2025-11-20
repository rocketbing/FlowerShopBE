const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  // Flower-specific attributes
  stems: {
    type: Number,
    required: [true, 'Please add number of stems'],
    min: [1, 'Stems must be at least 1'],
    default: 1,
  },
  color: {
    type: [String],
    required: [true, 'Please add at least one color'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one color is required',
    },
  },
  // Pricing
  regularPrice: {
    type: Number,
    required: [true, 'Please add regular price'],
    min: [0, 'Price must be positive'],
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price must be positive'],
    default: null,
  },
  // Legacy price field for backward compatibility
  price: {
    type: Number,
    min: [0, 'Price must be positive'],
  },
  // Quantity and stock
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  // Popularity rating (1-5)
  popularity: {
    type: Number,
    min: [1, 'Popularity must be at least 1'],
    max: [5, 'Popularity cannot exceed 5'],
    default: 3,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'roses',
      'tulips',
      'lilies',
      'sunflowers',
      'orchids',
      'carnations',
      'mixed',
      'other',
    ],
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      alt: String,
    },
  ],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for getting current price (discounted if available, otherwise regular)
ProductSchema.virtual('currentPrice').get(function() {
  return this.discountedPrice !== null && this.discountedPrice !== undefined 
    ? this.discountedPrice 
    : this.regularPrice;
});

// Pre-save hook to sync price field with regularPrice for backward compatibility
ProductSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('regularPrice')) {
    this.price = this.regularPrice;
  }
  next();
});

// Add indexes for better query performance
ProductSchema.index({ category: 1, isAvailable: 1 }); // Compound index for category and availability queries
ProductSchema.index({ isAvailable: 1 }); // For filtering available products
ProductSchema.index({ name: 'text', description: 'text' }); // Text search index
ProductSchema.index({ createdAt: -1 }); // For sorting by creation date
ProductSchema.index({ popularity: -1 }); // For sorting by popularity
ProductSchema.index({ color: 1 }); // For filtering by color
ProductSchema.index({ regularPrice: 1 }); // For price range queries
ProductSchema.index({ discountedPrice: 1 }); // For discounted products

// Ensure virtual fields are included in JSON output
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);

