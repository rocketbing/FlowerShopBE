const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadProductImage,
  deleteProductImage,
  getProductImagePresignedUrl,
} = require('../controllers/uploadController');

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

/**
 * @swagger
 * /api/upload/product-image:
 *   post:
 *     summary: Upload product image to S3
 *     tags: [Upload]
 *     description: Upload an image file for a product. The image will be stored in S3 and the URL will be returned.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, or GIF, max 10MB)
 *               alt:
 *                 type: string
 *                 description: Optional alt text for the image
 *                 example: "Red roses bouquet"
 *               productName:
 *                 type: string
 *                 description: Optional product name to organize images by product. If provided, images will be stored in a folder named after the product. Add this as a form-data field (not in JSON).
 *                 example: "Red Roses Bouquet"
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: S3 URL of the uploaded image
 *                       example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1234567890-abc123-red_roses.jpg"
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *                       example: "products/1234567890-abc123-red_roses.jpg"
 *                     alt:
 *                       type: string
 *                       description: Alt text for the image
 *                       example: "Red roses bouquet"
 *                     size:
 *                       type: integer
 *                       description: File size in bytes
 *                       example: 245678
 *                     mimetype:
 *                       type: string
 *                       example: "image/jpeg"
 *       400:
 *         description: Bad request (no file, invalid file type, or file too large)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/product-image',
  protect,
  authorize('admin'),
  upload.single('image'),
  (err, req, res, next) => {
    // Handle multer errors
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum file size is 10MB.',
        });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Please use "image" as the field name.',
        });
      }
      // Handle "Field name missing" error
      if (err.message && err.message.includes('Field name missing')) {
        return res.status(400).json({
          success: false,
          message: 'Field name missing. Please use "image" as the field name for the file upload. Make sure you are sending multipart/form-data with a field named "image".',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  },
  uploadProductImage
);

/**
 * @swagger
 * /api/upload/product-image:
 *   delete:
 *     summary: Delete product image from S3
 *     tags: [Upload]
 *     description: Delete an image from S3 using its URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: Full S3 URL of the image to delete
 *                 example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1234567890-abc123-red_roses.jpg"
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Image deleted successfully"
 *       400:
 *         description: Bad request (missing or invalid image URL)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.delete(
  '/product-image',
  protect,
  authorize('admin'),
  deleteProductImage
);

/**
 * @swagger
 * /api/upload/product-image/presigned:
 *   get:
 *     summary: Get Presigned URL for product image
 *     tags: [Upload]
 *     description: Generate a Presigned URL for accessing a private S3 image. The URL expires after the specified time.
 *     parameters:
 *       - in: query
 *         name: imageUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 image URL (can be original URL or S3 key)
 *         example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1234567890-abc123-red_roses.jpg"
 *       - in: query
 *         name: expiresIn
 *         required: false
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: URL expiration time in seconds (default: 3600 = 1 hour)
 *         example: 3600
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     presignedUrl:
 *                       type: string
 *                       description: Presigned URL that can be used to access the image
 *                       example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/1234567890-abc123-red_roses.jpg?X-Amz-Algorithm=..."
 *                     expiresIn:
 *                       type: integer
 *                       description: URL expiration time in seconds
 *                       example: 3600
 *                     originalUrl:
 *                       type: string
 *                       description: Original S3 URL
 *       400:
 *         description: Bad request (missing imageUrl or invalid URL)
 */
router.get(
  '/product-image/presigned',
  getProductImagePresignedUrl
);

module.exports = router;

