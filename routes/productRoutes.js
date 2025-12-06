const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductImagesByName,
  getAllProductImages,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for product creation with image upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or description
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color (case-insensitive search)
 *         example: "red"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *         example: 20
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *         example: 100
 *       - in: query
 *         name: onSale
 *         schema:
 *           type: boolean
 *         description: Filter products on sale (with discounted price)
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, regularPrice, popularity, name]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                       example: 1
 *                     size:
 *                       type: integer
 *                       description: Number of items per page
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       description: Total number of products
 *                       example: 50
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/category/{category}:
 *   get:
 *     summary: Get products by category
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *         description: Product category
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/category/:category', getProductsByCategory);

/**
 * @swagger
 * /api/products/images:
 *   get:
 *     summary: Get all product images
 *     tags: [Products]
 *     description: Retrieve all images stored in S3 products folder, regardless of product name or folder structure
 *     parameters:
 *       - in: query
 *         name: maxKeys
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Maximum number of images to return
 *         example: 100
 *     responses:
 *       200:
 *         description: All product images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of images found
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       originalUrl:
 *                         type: string
 *                         description: Original S3 URL
 *                         example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg"
 *                       presignedUrl:
 *                         type: string
 *                         description: Presigned URL for accessing the image (expires in 1 hour)
 *                         example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg?X-Amz-Algorithm=..."
 *                       key:
 *                         type: string
 *                         description: S3 object key
 *                         example: "products/red-roses-bouquet/123.jpg"
 *                       size:
 *                         type: integer
 *                         description: File size in bytes
 *                         example: 245678
 *                       lastModified:
 *                         type: string
 *                         format: date-time
 *                         description: Last modified timestamp
 *                       productName:
 *                         type: string
 *                         nullable: true
 *                         description: Product name extracted from folder structure (if organized by product)
 *                         example: "Red Roses Bouquet"
 */
router.get('/images', getAllProductImages);

/**
 * @swagger
 * /api/products/images/{productName}:
 *   get:
 *     summary: Get all images for a product by product name
 *     tags: [Products]
 *     description: Retrieve all images stored in S3 for a specific product, organized by product name folder
 *     parameters:
 *       - in: path
 *         name: productName
 *         required: true
 *         schema:
 *           type: string
 *         description: Product name (will be sanitized to match folder name)
 *         example: "Red Roses Bouquet"
 *     responses:
 *       200:
 *         description: Product images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of images found
 *                   example: 3
 *                 productName:
 *                   type: string
 *                   example: "Red Roses Bouquet"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       originalUrl:
 *                         type: string
 *                         description: Original S3 URL
 *                       presignedUrl:
 *                         type: string
 *                         description: Presigned URL for accessing the image
 *       400:
 *         description: Bad request (missing product name)
 */
router.get('/images/:productName', getProductImagesByName);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     description: |
 *       Create a new product. Supports two formats:
 *       1. **multipart/form-data**: Upload image file directly with product data
 *       2. **application/json**: Provide product data with image URL
 *       
 *       Only users with admin role can create products.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - stems
 *               - color
 *               - regularPrice
 *               - quantity
 *               - category
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file (optional if images.url is provided)
 *               name:
 *                 type: string
 *                 example: Red Roses Bouquet
 *               description:
 *                 type: string
 *                 example: Beautiful red roses arranged in a bouquet
 *               stems:
 *                 type: string
 *                 example: "12"
 *               color:
 *                 type: string
 *                 example: "red"
 *               regularPrice:
 *                 type: string
 *                 example: "49.99"
 *               discountedPrice:
 *                 type: string
 *                 nullable: true
 *                 example: "39.99"
 *               quantity:
 *                 type: string
 *                 example: "10"
 *               popularity:
 *                 type: string
 *                 example: "4"
 *               category:
 *                 type: string
 *                 enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *                 example: roses
 *               alt:
 *                 type: string
 *                 description: Image alt text (optional)
 *                 example: "Red roses bouquet"
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - stems
 *               - color
 *               - regularPrice
 *               - quantity
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Red Roses Bouquet
 *               description:
 *                 type: string
 *                 example: Beautiful red roses arranged in a bouquet
 *               stems:
 *                 type: number
 *                 minimum: 1
 *                 example: 12
 *               color:
 *                 type: string
 *                 description: Flower color
 *                 example: "red"
 *               regularPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 49.99
 *               discountedPrice:
 *                 type: number
 *                 nullable: true
 *                 minimum: 0
 *                 example: 39.99
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Product quantity (isAvailable is automatically set based on quantity > 0)
 *                 example: 1
 *               popularity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *                 example: 4
 *               category:
 *                 type: string
 *                 enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *                 example: roses
 *               images:
 *                 type: object
 *                 description: Product image (required if image file is not uploaded)
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://faux-flower-supply.s3.us-east-2.amazonaws.com/products/red-roses-bouquet/123.jpg"
 *                   alt:
 *                     type: string
 *                     example: "Red roses bouquet"
 *               isAvailable:
 *                 type: boolean
 *                 description: Automatically set based on quantity (true if quantity > 0)
 *                 example: true
 *               numReviews:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 0
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request (invalid data or file)
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'), // Support optional image file upload
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
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  },
  createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     description: |
 *       Update a product. Supports two formats:
 *       1. **multipart/form-data**: Upload new image file directly (old image will be automatically deleted)
 *       2. **application/json**: Update product data with image URL
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New product image file (optional, if provided will replace old image and delete it from S3)
 *               name:
 *                 type: string
 *                 example: Red Roses Bouquet
 *               description:
 *                 type: string
 *               stems:
 *                 type: string
 *                 example: "12"
 *               color:
 *                 type: string
 *               regularPrice:
 *                 type: string
 *                 example: "49.99"
 *               discountedPrice:
 *                 type: string
 *                 nullable: true
 *               quantity:
 *                 type: string
 *               popularity:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *               alt:
 *                 type: string
 *                 description: Image alt text (optional)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               stems:
 *                 type: number
 *                 minimum: 1
 *               color:
 *                 type: string
 *                 description: Flower color
 *               regularPrice:
 *                 type: number
 *                 minimum: 0
 *               discountedPrice:
 *                 type: number
 *                 nullable: true
 *                 minimum: 0
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Product quantity (isAvailable is automatically set based on quantity > 0)
 *               popularity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               category:
 *                 type: string
 *                 enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *               images:
 *                 type: object
 *                 description: Product image (optional, if not provided keeps existing image)
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt:
 *                     type: string
 *               isAvailable:
 *                 type: boolean
 *                 description: Automatically set based on quantity (true if quantity > 0)
 *               numReviews:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'), // Support optional image file upload
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
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  },
  updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: Product deleted
 *       404:
 *         description: Product not found
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
