const DiscountCode = require('../models/DiscountCode');
const { validationResult } = require('express-validator');

// @desc    Create a new discount code
// @route   POST /api/discount-codes
// @access  Private/Admin
exports.createDiscountCode = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validTo,
      usageLimit,
      oneTimeUse,
      applicableCategories,
      isActive,
    } = req.body;

    // Check if code already exists
    const existingCode = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Discount code already exists',
      });
    }

    // Validate discount value based on type
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%',
      });
    }

    // Validate dates
    if (validTo && validFrom && new Date(validTo) < new Date(validFrom)) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be after start date',
      });
    }

    const discountCode = await DiscountCode.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount,
      validFrom: validFrom || new Date(),
      validTo,
      usageLimit,
      oneTimeUse: oneTimeUse || false,
      applicableCategories: applicableCategories || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: discountCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify discount code
// @route   POST /api/discount-codes/verify
// @access  Public (or Private if you want to track usage)
exports.verifyDiscountCode = async (req, res, next) => {
  try {
    const { code, subtotal, category } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required',
      });
    }

    if (subtotal === undefined || subtotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid subtotal is required',
      });
    }

    // Find discount code
    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
    });

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found',
      });
    }

    // Check if code is valid
    if (!discountCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is not valid or has expired',
      });
    }

    // Check category restriction if applicable
    if (
      discountCode.applicableCategories.length > 0 &&
      category &&
      !discountCode.applicableCategories.includes(category)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is not applicable to this category',
      });
    }

    // Calculate discount
    const result = discountCode.calculateDiscount(subtotal);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        code: discountCode.code,
        description: discountCode.description,
        discountType: discountCode.discountType,
        discountValue: discountCode.discountValue,
        subtotal,
        discount: result.discount,
        finalAmount: result.finalAmount,
        minPurchase: discountCode.minPurchase,
        maxDiscount: discountCode.maxDiscount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all discount codes
// @route   GET /api/discount-codes
// @access  Private/Admin
exports.getAllDiscountCodes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const discountCodes = await DiscountCode.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await DiscountCode.countDocuments(query);

    res.status(200).json({
      success: true,
      data: discountCodes,
      pagination: {
        page: pageNum,
        size: limitNum,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single discount code
// @route   GET /api/discount-codes/:id
// @access  Private/Admin
exports.getDiscountCode = async (req, res, next) => {
  try {
    const discountCode = await DiscountCode.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found',
      });
    }

    res.status(200).json({
      success: true,
      data: discountCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update discount code
// @route   PUT /api/discount-codes/:id
// @access  Private/Admin
exports.updateDiscountCode = async (req, res, next) => {
  try {
    let discountCode = await DiscountCode.findById(req.params.id);

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found',
      });
    }

    const {
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validTo,
      usageLimit,
      oneTimeUse,
      applicableCategories,
      isActive,
    } = req.body;

    // Validate discount value if provided
    if (discountValue !== undefined) {
      const type = discountType || discountCode.discountType;
      if (type === 'percentage' && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount cannot exceed 100%',
        });
      }
    }

    // Validate dates if provided
    const finalValidFrom = validFrom || discountCode.validFrom;
    const finalValidTo = validTo || discountCode.validTo;
    if (new Date(finalValidTo) < new Date(finalValidFrom)) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be after start date',
      });
    }

    // Update fields
    if (description !== undefined) discountCode.description = description;
    if (discountType !== undefined) discountCode.discountType = discountType;
    if (discountValue !== undefined) discountCode.discountValue = discountValue;
    if (minPurchase !== undefined) discountCode.minPurchase = minPurchase;
    if (maxDiscount !== undefined) discountCode.maxDiscount = maxDiscount;
    if (validFrom !== undefined) discountCode.validFrom = validFrom;
    if (validTo !== undefined) discountCode.validTo = validTo;
    if (usageLimit !== undefined) discountCode.usageLimit = usageLimit;
    if (oneTimeUse !== undefined) discountCode.oneTimeUse = oneTimeUse;
    if (applicableCategories !== undefined)
      discountCode.applicableCategories = applicableCategories;
    if (isActive !== undefined) discountCode.isActive = isActive;

    await discountCode.save();

    res.status(200).json({
      success: true,
      data: discountCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete discount code
// @route   DELETE /api/discount-codes/:id
// @access  Private/Admin
exports.deleteDiscountCode = async (req, res, next) => {
  try {
    const discountCode = await DiscountCode.findById(req.params.id);

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: 'Discount code not found',
      });
    }

    await discountCode.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Discount code deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

