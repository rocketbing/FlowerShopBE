const User = require('../models/User');

// @desc    Get current user information
// @route   GET /api/userinfo
// @access  Private
exports.getCurrentUserInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -activationCode -activationCodeExpire -googleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        homeAddress: user.homeAddress || null,
        shippingAddress: user.shippingAddress || [],
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user information
// @route   PUT /api/userinfo
// @access  Private
exports.updateUserInfo = async (req, res, next) => {
  try {
    const { name, phone, homeAddress, shippingAddress } = req.body;

    // Build update object (only include provided fields)
    const updateFields = {};
    if (name !== undefined) {
      updateFields.name = name;
    }
    if (phone !== undefined) {
      updateFields.phone = phone;
    }
    if (homeAddress !== undefined) {
      // Allow null to delete homeAddress, or validate it's an object
      if (homeAddress === null) {
        updateFields.homeAddress = null;
      } else if (typeof homeAddress !== 'object' || Array.isArray(homeAddress)) {
        return res.status(400).json({
          success: false,
          message: 'HomeAddress must be an object or null',
        });
      } else {
        updateFields.homeAddress = homeAddress;
      }
    }
    // Handle shippingAddress separately - need to fetch user first to push to array
    let shouldUpdateShippingAddress = false;
    let shippingAddressToAdd = null;

    if (shippingAddress !== undefined) {
      // If shippingAddress is an object (not array), push it to existing array
      if (typeof shippingAddress === 'object' && !Array.isArray(shippingAddress)) {
        shouldUpdateShippingAddress = true;
        shippingAddressToAdd = shippingAddress;
      } 
      // If shippingAddress is an array, replace the entire array
      else if (Array.isArray(shippingAddress)) {
        updateFields.shippingAddress = shippingAddress;
      } 
      else {
        return res.status(400).json({
          success: false,
          message: 'ShippingAddress must be an object or an array',
        });
      }
    }

    // Update user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Apply other updates
    if (Object.keys(updateFields).length > 0) {
      Object.assign(user, updateFields);
    }

    // Handle shippingAddress push if needed
    if (shouldUpdateShippingAddress && shippingAddressToAdd) {
      // Ensure shippingAddress array exists
      if (!user.shippingAddress) {
        user.shippingAddress = [];
      }
      // Push the new address to the array
      user.shippingAddress.push(shippingAddressToAdd);
    }

    // Save the user
    await user.save();

    // Select fields for response
    const updatedUser = await User.findById(req.user.id)
      .select('-password -activationCode -activationCodeExpire -googleId');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        homeAddress: updatedUser.homeAddress || null,
        shippingAddress: updatedUser.shippingAddress || [],
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        provider: updatedUser.provider,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users information (Admin only)
// @route   GET /api/userinfo/all
// @access  Private/Admin
exports.getAllUsersInfo = async (req, res, next) => {
  try {
    const { page, size } = req.query;

    // Validate required parameters
    if (!page || !size) {
      return res.status(400).json({
        success: false,
        message: 'Page and size parameters are required',
      });
    }

    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);

    // Validate page and size are positive integers
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer',
      });
    }

    if (isNaN(sizeNum) || sizeNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Size must be a positive integer',
      });
    }

    // Calculate skip
    const skip = (pageNum - 1) * sizeNum;

    // Get users with pagination
    const users = await User.find()
      .select('-password -activationCode -activationCodeExpire -googleId')
      .skip(skip)
      .limit(sizeNum)
      .sort({ createdAt: -1 });

    // Get total count
    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        homeAddress: user.homeAddress || null,
        shippingAddress: user.shippingAddress || [],
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider,
        createdAt: user.createdAt,
      })),
      pagination: {
        page: pageNum,
        size: sizeNum,
        total: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific shipping address by ID
// @route   DELETE /api/userinfo/shipping-address/:addressId
// @access  Private
exports.deleteShippingAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required',
      });
    }

    // Find user and remove the specific address
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if address exists
    const addressIndex = user.shippingAddress.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping address not found',
      });
    }

    // Remove the address using pull
    user.shippingAddress.pull({ _id: addressId });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Shipping address deleted successfully',
      data: {
        id: user._id,
        shippingAddress: user.shippingAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific shipping address by ID
// @route   PUT /api/userinfo/shipping-address/:addressId
// @access  Private
exports.updateShippingAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const {
      firstName,
      lastName,
      phoneNumber,
      street,
      city,
      state,
      zipCode,
      country,
    } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required',
      });
    }

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find the address
    const address = user.shippingAddress.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Shipping address not found',
      });
    }

    // Update only provided fields
    if (firstName !== undefined) address.firstName = firstName;
    if (lastName !== undefined) address.lastName = lastName;
    if (phoneNumber !== undefined) address.phoneNumber = phoneNumber;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (country !== undefined) address.country = country;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Shipping address updated successfully',
      data: {
        id: user._id,
        shippingAddress: user.shippingAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};

