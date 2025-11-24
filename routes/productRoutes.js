const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

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
 *     description: Only users with admin role can create products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
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
 *                 description: Product image
 *                 properties:
 *                   url:
 *                     type: string
 *                     required: true
 *                     example: "https://example.com/image.jpg"
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
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', protect, authorize('admin'), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
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
 *     requestBody:
 *       required: true
 *       content:
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
 *                 description: Product image
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
router.put('/:id', protect, authorize('admin'), updateProduct);

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
