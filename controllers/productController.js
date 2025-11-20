const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
// @query   category, search, color, minPrice, maxPrice, onSale, sortBy, page, limit
exports.getProducts = async (req, res, next) => {
  try {
    const { 
      category, 
      search, 
      color, 
      minPrice, 
      maxPrice, 
      onSale, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (color) {
      query.color = { $in: Array.isArray(color) ? color : [color] };
    }
    if (minPrice || maxPrice) {
      query.regularPrice = {};
      if (minPrice) {
        query.regularPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.regularPrice.$lte = parseFloat(maxPrice);
      }
    }
    if (onSale === 'true') {
      query.discountedPrice = { $ne: null, $gt: 0 };
    }
    query.isAvailable = true;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'popularity':
        sortOptions.popularity = sortOrderNum;
        break;
      case 'price':
        sortOptions.regularPrice = sortOrderNum;
        break;
      case 'name':
        sortOptions.name = sortOrderNum;
        break;
      default:
        sortOptions.createdAt = sortOrderNum;
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort(sortOptions);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      isAvailable: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

