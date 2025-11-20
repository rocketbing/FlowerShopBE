const express = require('express');
const router = express.Router();
const {
  getCurrentUserInfo,
  updateUserInfo,
  getAllUsersInfo,
  deleteShippingAddress,
  updateShippingAddress,
} = require('../controllers/userInfoController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/userinfo:
 *   get:
 *     summary: Get current user information
 *     tags: [UserInfo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     homeAddress:
 *                       type: object
 *                     shippingAddress:
 *                       type: array
 *                       items:
 *                         type: object
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                     emailVerified:
 *                       type: boolean
 *                     provider:
 *                       type: string
 *                       enum: [local, google]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getCurrentUserInfo);

/**
 * @swagger
 * /api/userinfo:
 *   put:
 *     summary: Update current user information
 *     tags: [UserInfo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User name (username)
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "1234567890"
 *               homeAddress:
 *                 type: object
 *                 description: Home address (object)
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     description: First name
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     description: Last name
 *                     example: "Doe"
 *                   phoneNumber:
 *                     type: string
 *                     description: Phone number
 *                     example: "123-456-7890"
 *                   street:
 *                     type: string
 *                     example: "123 Main St"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   zipCode:
 *                     type: string
 *                     example: "10001"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                 example:
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   phoneNumber: "123-456-7890"
 *                   street: "123 Main St"
 *                   city: "New York"
 *                   state: "NY"
 *                   zipCode: "10001"
 *                   country: "USA"
 *               shippingAddress:
 *                 type: array
 *                 description: Array of shipping addresses
 *                 items:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       description: First name
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       description: Last name
 *                       example: "Smith"
 *                     phoneNumber:
 *                       type: string
 *                       description: Phone number
 *                       example: "987-654-3210"
 *                     street:
 *                       type: string
 *                       example: "456 Oak Ave"
 *                     city:
 *                       type: string
 *                       example: "Los Angeles"
 *                     state:
 *                       type: string
 *                       example: "CA"
 *                     zipCode:
 *                       type: string
 *                       example: "90001"
 *                     country:
 *                       type: string
 *                       example: "USA"
 *                 example:
 *                   - firstName: "Jane"
 *                     lastName: "Smith"
 *                     phoneNumber: "987-654-3210"
 *                     street: "456 Oak Ave"
 *                     city: "Los Angeles"
 *                     state: "CA"
 *                     zipCode: "90001"
 *                     country: "USA"
 *     responses:
 *       200:
 *         description: User information updated successfully
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     homeAddress:
 *                       type: object
 *                     shippingAddress:
 *                       type: array
 *                       items:
 *                         type: object
 *                     role:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     provider:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input (e.g., homeAddress is not an object or shippingAddress is not an array)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', protect, updateUserInfo);

/**
 * @swagger
 * /api/userinfo/all:
 *   get:
 *     summary: Get all users information (Admin only)
 *     tags: [UserInfo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (required)
 *         example: 1
 *       - in: query
 *         name: size
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page (required)
 *         example: 10
 *     responses:
 *       200:
 *         description: Users information retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       homeAddress:
 *                         type: object
 *                       shippingAddress:
 *                         type: array
 *                         items:
 *                           type: object
 *                       role:
 *                         type: string
 *                         enum: [user, admin]
 *                       emailVerified:
 *                         type: boolean
 *                       provider:
 *                         type: string
 *                         enum: [local, google]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     size:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *       400:
 *         description: Missing or invalid page/size parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/all', protect, authorize('admin'), getAllUsersInfo);

/**
 * @swagger
 * /api/userinfo/shipping-address/{addressId}:
 *   delete:
 *     summary: Delete a specific shipping address by ID
 *     tags: [UserInfo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping address ID (_id)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Shipping address deleted successfully
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
 *                   example: "Shipping address deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     shippingAddress:
 *                       type: array
 *                       description: Updated shipping addresses array
 *                       items:
 *                         type: object
 *       400:
 *         description: Address ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found or shipping address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/userinfo/shipping-address/{addressId}:
 *   put:
 *     summary: Update a specific shipping address by ID
 *     tags: [UserInfo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping address ID (_id)
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Last name
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number
 *                 example: "123-456-7890"
 *               street:
 *                 type: string
 *                 description: Street address
 *                 example: "789 Pine St"
 *               city:
 *                 type: string
 *                 description: City
 *                 example: "Toronto"
 *               state:
 *                 type: string
 *                 description: State/Province
 *                 example: "ON"
 *               zipCode:
 *                 type: string
 *                 description: ZIP/Postal code
 *                 example: "M5H 2N2"
 *               country:
 *                 type: string
 *                 description: Country
 *                 example: "Canada"
 *             example:
 *               firstName: "John"
 *               lastName: "Doe"
 *               phoneNumber: "123-456-7890"
 *               street: "789 Pine St"
 *               city: "Toronto"
 *               state: "ON"
 *               zipCode: "M5H 2N2"
 *               country: "Canada"
 *     responses:
 *       200:
 *         description: Shipping address updated successfully
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
 *                   example: "Shipping address updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     shippingAddress:
 *                       type: array
 *                       description: Updated shipping addresses array
 *                       items:
 *                         type: object
 *       400:
 *         description: Address ID is required or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found or shipping address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/shipping-address/:addressId', protect, updateShippingAddress);

router.delete('/shipping-address/:addressId', protect, deleteShippingAddress);

module.exports = router;

