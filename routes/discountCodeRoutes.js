const express = require('express');
const router = express.Router();
const {
  createDiscountCode,
  verifyDiscountCode,
  getAllDiscountCodes,
  getDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} = require('../controllers/discountCodeController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @swagger
 * /api/discount-codes:
 *   post:
 *     summary: Create a new discount code (Admin only)
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - validTo
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code (uppercase, alphanumeric, 3-20 characters)
 *                 example: "SAVE20"
 *               description:
 *                 type: string
 *                 description: Description of the discount code
 *                 example: "20% off on all products"
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 description: Type of discount
 *                 example: "percentage"
 *               discountValue:
 *                 type: number
 *                 description: Discount value (percentage 0-100 or fixed amount)
 *                 minimum: 0
 *                 example: 20
 *               minPurchase:
 *                 type: number
 *                 description: Minimum purchase amount required
 *                 minimum: 0
 *                 example: 50
 *               maxDiscount:
 *                 type: number
 *                 nullable: true
 *                 description: Maximum discount amount (for percentage discounts)
 *                 minimum: 0
 *                 example: 100
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Start date (defaults to now)
 *                 example: "2024-01-01T00:00:00Z"
 *               validTo:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date (required)
 *                 example: "2024-12-31T23:59:59Z"
 *               usageLimit:
 *                 type: number
 *                 nullable: true
 *                 description: Maximum number of times code can be used (null = unlimited)
 *                 minimum: 0
 *                 example: 100
 *               oneTimeUse:
 *                 type: boolean
 *                 description: Can only be used once per user
 *                 default: false
 *                 example: false
 *               applicableCategories:
 *                 type: array
 *                 description: Applicable categories (empty = all categories)
 *                 items:
 *                   type: string
 *                   enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *                 example: ["roses", "tulips"]
 *               isActive:
 *                 type: boolean
 *                 description: Whether the code is active
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Discount code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DiscountCode'
 *       400:
 *         description: Invalid input or code already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('code')
      .trim()
      .isLength({ min: 3, max: 20 })
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Code must be 3-20 characters, uppercase letters and numbers only'),
    body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
    body('validTo').isISO8601().withMessage('Valid expiration date is required'),
  ],
  createDiscountCode
);

/**
 * @swagger
 * /api/discount-codes/verify:
 *   post:
 *     summary: Verify a discount code
 *     tags: [DiscountCodes]
 *     description: Verify if a discount code is valid and calculate discount
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - subtotal
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code to verify
 *                 example: "SAVE20"
 *               subtotal:
 *                 type: number
 *                 description: Order subtotal amount
 *                 minimum: 0
 *                 example: 100
 *               category:
 *                 type: string
 *                 description: Product category (optional, for category-specific codes)
 *                 enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *                 example: "roses"
 *     responses:
 *       200:
 *         description: Discount code verified successfully
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
 *                     code:
 *                       type: string
 *                       example: "SAVE20"
 *                     description:
 *                       type: string
 *                     discountType:
 *                       type: string
 *                       enum: [percentage, fixed]
 *                     discountValue:
 *                       type: number
 *                     subtotal:
 *                       type: number
 *                     discount:
 *                       type: number
 *                       description: Calculated discount amount
 *                     finalAmount:
 *                       type: number
 *                       description: Final amount after discount
 *                     minPurchase:
 *                       type: number
 *                     maxDiscount:
 *                       type: number
 *       400:
 *         description: Invalid code or requirements not met
 *       404:
 *         description: Discount code not found
 */
router.post('/verify', verifyDiscountCode);

/**
 * @swagger
 * /api/discount-codes:
 *   get:
 *     summary: Get all discount codes (Admin only)
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Discount codes retrieved successfully
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
 *                     $ref: '#/components/schemas/DiscountCode'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     size:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', protect, authorize('admin'), getAllDiscountCodes);

/**
 * @swagger
 * /api/discount-codes/{id}:
 *   get:
 *     summary: Get single discount code by ID (Admin only)
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code ID
 *     responses:
 *       200:
 *         description: Discount code retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DiscountCode'
 *       404:
 *         description: Discount code not found
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', protect, authorize('admin'), getDiscountCode);

/**
 * @swagger
 * /api/discount-codes/{id}:
 *   put:
 *     summary: Update a discount code (Admin only)
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *                 minimum: 0
 *               minPurchase:
 *                 type: number
 *                 minimum: 0
 *               maxDiscount:
 *                 type: number
 *                 nullable: true
 *                 minimum: 0
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: number
 *                 nullable: true
 *                 minimum: 0
 *               oneTimeUse:
 *                 type: boolean
 *               applicableCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [roses, tulips, lilies, sunflowers, orchids, carnations, mixed, other]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Discount code updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DiscountCode'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Discount code not found
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', protect, authorize('admin'), updateDiscountCode);

/**
 * @swagger
 * /api/discount-codes/{id}:
 *   delete:
 *     summary: Delete a discount code (Admin only)
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code ID
 *     responses:
 *       200:
 *         description: Discount code deleted successfully
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
 *                   example: "Discount code deleted successfully"
 *       404:
 *         description: Discount code not found
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', protect, authorize('admin'), deleteDiscountCode);

module.exports = router;

