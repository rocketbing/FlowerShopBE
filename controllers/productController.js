const Product = require('../models/Product');
const { addPresignedUrlToProduct, addPresignedUrlsToProducts } = require('../utils/imageUrlHelper');

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
      // Color is now a string, support exact match or case-insensitive search
      query.color = { $regex: color, $options: 'i' };
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

    // Generate Presigned URLs for product images (expires in 1 hour)
    const productsWithPresignedUrls = await addPresignedUrlsToProducts(products, 3600);

    res.status(200).json({
      success: true,
      data: productsWithPresignedUrls,
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

    // Generate Presigned URL for product image (expires in 1 hour)
    const productWithPresignedUrl = await addPresignedUrlToProduct(product, 3600);

    res.status(200).json({
      success: true,
      data: productWithPresignedUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
// Supports both JSON (with image URL) and multipart/form-data (with image file)
exports.createProduct = async (req, res, next) => {
  try {
    let productData = { ...req.body };
    let imageUrl = null;
    let imageAlt = null;

    // Check if image file was uploaded (multipart/form-data)
    if (req.file) {
      const s3Service = require('../utils/s3Service');
      const { getProductImagePresignedUrl } = require('../utils/imageUrlHelper');

      const file = req.file;

      // Validate file type
      if (!s3Service.isValidFileType(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
        });
      }

      // Validate file size (max 10MB)
      if (!s3Service.isValidFileSize(file.size, 10)) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum file size is 10MB.',
        });
      }

      // Get product name for organizing images
      const productName = req.body.name || null;

      // Generate unique file name
      const fileName = s3Service.generateFileName(file.originalname, 'products', productName);

      // Upload to S3
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to S3',
          error: uploadResult.error,
        });
      }

      // Use uploaded image URL
      imageUrl = uploadResult.url;
      imageAlt = req.body.alt || req.body.imageAlt || file.originalname;

      // Remove file-related fields from productData (they're not part of Product schema)
      delete productData.image;
      delete productData.imageAlt;
    }

    // If image URL is provided in request body (JSON format) or from file upload
    if (imageUrl) {
      productData.images = {
        url: imageUrl,
        alt: imageAlt || productData.images?.alt || productData.name || '',
      };
    } else if (productData.images && productData.images.url) {
      // If images.url is already provided in JSON, use it
      productData.images = {
        url: productData.images.url,
        alt: productData.images.alt || productData.name || '',
      };
    }

    // Parse numeric fields if they come as strings from form-data
    if (typeof productData.stems === 'string') {
      productData.stems = parseInt(productData.stems);
    }
    if (typeof productData.regularPrice === 'string') {
      productData.regularPrice = parseFloat(productData.regularPrice);
    }
    if (typeof productData.discountedPrice === 'string') {
      productData.discountedPrice = productData.discountedPrice ? parseFloat(productData.discountedPrice) : null;
    }
    if (typeof productData.quantity === 'string') {
      productData.quantity = parseInt(productData.quantity);
    }
    if (typeof productData.popularity === 'string') {
      productData.popularity = parseInt(productData.popularity);
    }

    // Create product
    const product = await Product.create(productData);

    // Generate Presigned URL for the image (expires in 1 hour)
    const productWithPresignedUrl = await addPresignedUrlToProduct(product, 3600);

    res.status(201).json({
      success: true,
      data: productWithPresignedUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
// Supports both JSON (with image URL) and multipart/form-data (with image file)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let productData = { ...req.body };
    let imageUrl = null;
    let imageAlt = null;
    let oldImageUrl = product.images?.url; // Store old image URL for potential deletion

    // Check if new image file was uploaded (multipart/form-data)
    if (req.file) {
      const s3Service = require('../utils/s3Service');

      const file = req.file;

      // Validate file type
      if (!s3Service.isValidFileType(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
        });
      }

      // Validate file size (max 10MB)
      if (!s3Service.isValidFileSize(file.size, 10)) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum file size is 10MB.',
        });
      }

      // Get product name for organizing images (use updated name if provided, otherwise current name)
      const productName = req.body.name || product.name || null;

      // Generate unique file name
      const fileName = s3Service.generateFileName(file.originalname, 'products', productName);

      // Upload to S3
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to S3',
          error: uploadResult.error,
        });
      }

      // Use uploaded image URL
      imageUrl = uploadResult.url;
      imageAlt = req.body.alt || req.body.imageAlt || file.originalname;

      // Remove file-related fields from productData
      delete productData.image;
      delete productData.imageAlt;

      // Delete old image from S3 if it exists and is different
      if (oldImageUrl && oldImageUrl !== imageUrl) {
        try {
          const oldFileKey = s3Service.extractKeyFromUrl(oldImageUrl);
          if (oldFileKey) {
            await s3Service.deleteFile(oldFileKey);
            console.log(`✅ Deleted old image from S3: ${oldFileKey}`);
          }
        } catch (deleteError) {
          // Log but don't fail the update if image deletion fails
          console.warn('⚠️  Failed to delete old image from S3:', deleteError.message);
        }
      }
    }

    // If new image URL is provided (from file upload or JSON)
    if (imageUrl) {
      productData.images = {
        url: imageUrl,
        alt: imageAlt || productData.images?.alt || productData.name || product.name || '',
      };
    } else if (productData.images && productData.images.url) {
      // If images.url is provided in JSON, use it
      productData.images = {
        url: productData.images.url,
        alt: productData.images.alt || productData.name || product.name || '',
      };
    }

    // Parse numeric fields if they come as strings from form-data
    if (typeof productData.stems === 'string') {
      productData.stems = parseInt(productData.stems);
    }
    if (typeof productData.regularPrice === 'string') {
      productData.regularPrice = parseFloat(productData.regularPrice);
    }
    if (typeof productData.discountedPrice === 'string') {
      productData.discountedPrice = productData.discountedPrice ? parseFloat(productData.discountedPrice) : null;
    }
    if (typeof productData.quantity === 'string') {
      productData.quantity = parseInt(productData.quantity);
    }
    if (typeof productData.popularity === 'string') {
      productData.popularity = parseInt(productData.popularity);
    }

    // Update product
    product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    });

    // Generate Presigned URL for product image (expires in 1 hour)
    const productWithPresignedUrl = await addPresignedUrlToProduct(product, 3600);

    res.status(200).json({
      success: true,
      data: productWithPresignedUrl,
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

    // Delete image from S3 if it exists
    if (product.images && product.images.url) {
      try {
        const s3Service = require('../utils/s3Service');
        const fileKey = s3Service.extractKeyFromUrl(product.images.url);
        
        if (fileKey) {
          await s3Service.deleteFile(fileKey);
          console.log(`✅ Deleted product image from S3: ${fileKey}`);
        }
      } catch (deleteError) {
        // Log but don't fail the deletion if image deletion fails
        console.warn('⚠️  Failed to delete product image from S3:', deleteError.message);
        console.warn('   Product will still be deleted from database');
      }
    }

    // Delete product from database
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

    // Generate Presigned URLs for product images (expires in 1 hour)
    const productsWithPresignedUrls = await addPresignedUrlsToProducts(products, 3600);

    res.status(200).json({
      success: true,
      count: productsWithPresignedUrls.length,
      data: productsWithPresignedUrls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all images for a product by product name
// @route   GET /api/products/images/:productName
// @access  Public
exports.getProductImagesByName = async (req, res, next) => {
  try {
    const { productName } = req.params;
    const { getProductImages } = require('../utils/s3ImageHelper');
    const { getProductImagePresignedUrl } = require('../utils/imageUrlHelper');

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required',
      });
    }

    // Get all images for this product from S3
    const imageUrls = await getProductImages(productName);

    if (imageUrls.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No images found for this product',
        data: [],
      });
    }

    // Generate Presigned URLs for all images (expires in 1 hour)
    const imagesWithPresignedUrls = await Promise.all(
      imageUrls.map(async (url) => {
        const presignedUrl = await getProductImagePresignedUrl(url, 3600);
        return {
          originalUrl: url,
          presignedUrl: presignedUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: imagesWithPresignedUrls.length,
      productName: productName,
      data: imagesWithPresignedUrls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all product images (regardless of product name)
// @route   GET /api/products/images
// @access  Public
exports.getAllProductImages = async (req, res, next) => {
  try {
    const { maxKeys = 1000 } = req.query;
    const { getAllProductImages } = require('../utils/s3ImageHelper');
    const { getProductImagePresignedUrl } = require('../utils/imageUrlHelper');

    // Get all images from S3
    const images = await getAllProductImages(parseInt(maxKeys));

    if (images.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No images found',
        count: 0,
        data: [],
      });
    }

    // Generate Presigned URLs for all images (expires in 1 hour)
    const imagesWithPresignedUrls = await Promise.all(
      images.map(async (image) => {
        const presignedUrl = await getProductImagePresignedUrl(image.url, 3600);
        return {
          originalUrl: image.url,
          presignedUrl: presignedUrl,
          key: image.key,
          size: image.size,
          lastModified: image.lastModified,
          productName: image.productName, // Extracted from folder structure
        };
      })
    );

    res.status(200).json({
      success: true,
      count: imagesWithPresignedUrls.length,
      data: imagesWithPresignedUrls,
    });
  } catch (error) {
    next(error);
  }
};

