const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     description: This endpoint is called by Stripe to notify about payment events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Webhook error
 */
router.post('/webhook', stripeWebhook);

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create Stripe payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientSecret:
 *                   type: string
 *                   description: Stripe client secret for frontend
 *                   example: "pi_xxx_secret_xxx"
 *                 paymentIntentId:
 *                   type: string
 *                   example: "pi_xxx"
 *       400:
 *         description: Order is already paid or invalid request
 *       403:
 *         description: Not authorized to access this order
 *       404:
 *         description: Order not found
 */
router.post('/create-intent', protect, createPaymentIntent);

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: Stripe payment intent ID
 *                 example: "pi_xxx"
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
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
 *                   example: Payment confirmed
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Payment not completed
 */
router.post('/confirm', protect, confirmPayment);

module.exports = router;
