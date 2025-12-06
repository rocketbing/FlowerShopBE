const s3Service = require('../utils/s3Service');
const { getProductImagePresignedUrl } = require('../utils/imageUrlHelper');

/**
 * @desc    Upload product image to S3
 * @route   POST /api/upload/product-image
 * @access  Private/Admin
 */
exports.uploadProductImage = async (req, res, next) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide an image file.',
      });
    }

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

    // Get product name from request body (optional)
    // If provided, images will be organized by product name
    const productName = req.body.productName || req.body.name || null;

    // Get alt text from request body (optional)
    // Check both req.body.alt and ensure it's not empty string
    const altText = (req.body.alt && req.body.alt.trim() !== '') 
      ? req.body.alt.trim() 
      : file.originalname;

    // Debug logging (can be removed in production)
    console.log('📝 Upload request body:', {
      productName: productName,
      alt: req.body.alt,
      altText: altText,
      originalName: file.originalname,
    });

    // Generate unique file name (organized by product name if provided)
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

    // Generate Presigned URL for immediate use (expires in 1 hour)
    const presignedUrl = await getProductImagePresignedUrl(uploadResult.url, 3600);

    // Return image URL, Presigned URL, and metadata
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.url, // Original S3 URL (private)
        presignedUrl: presignedUrl, // Presigned URL for immediate access (expires in 1 hour)
        key: uploadResult.key,
        alt: altText, // Use the processed alt text
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    next(error);
  }
};

/**
 * @desc    Delete product image from S3
 * @route   DELETE /api/upload/product-image
 * @access  Private/Admin
 */
exports.deleteProductImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Extract S3 key from URL
    const fileKey = s3Service.extractKeyFromUrl(imageUrl);

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format',
      });
    }

    // Delete from S3
    const deleteResult = await s3Service.deleteFile(fileKey);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete image from S3',
        error: deleteResult.error,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('❌ Image delete error:', error);
    next(error);
  }
};

/**
 * @desc    Get Presigned URL for product image
 * @route   GET /api/upload/product-image/presigned
 * @access  Public
 */
exports.getProductImagePresignedUrl = async (req, res, next) => {
  try {
    const { imageUrl } = req.query;
    const { expiresIn = 3600 } = req.query; // Default 1 hour

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl query parameter is required',
      });
    }

    // Generate Presigned URL
    const presignedUrl = await getProductImagePresignedUrl(imageUrl, parseInt(expiresIn));

    if (!presignedUrl) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate Presigned URL. Invalid image URL.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        presignedUrl: presignedUrl,
        expiresIn: parseInt(expiresIn),
        originalUrl: imageUrl,
      },
    });
  } catch (error) {
    console.error('❌ Presigned URL generation error:', error);
    next(error);
  }
};

