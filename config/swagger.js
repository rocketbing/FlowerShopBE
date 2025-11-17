const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flower Shop API',
      version: '1.0.0',
      description: 'Online flower shop backend API documentation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
            },
            emailVerified: {
              type: 'boolean',
              description: 'Whether email is verified',
              example: false,
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' },
              },
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Product ID',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
            price: {
              type: 'number',
              description: 'Product price',
            },
            category: {
              type: 'string',
              enum: [
                'roses',
                'tulips',
                'lilies',
                'sunflowers',
                'orchids',
                'carnations',
                'mixed',
                'other',
              ],
              description: 'Product category',
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' },
                },
              },
            },
            stock: {
              type: 'number',
              description: 'Product stock quantity',
            },
            isAvailable: {
              type: 'boolean',
              description: 'Product availability',
            },
            rating: {
              type: 'number',
              description: 'Product rating',
            },
            numReviews: {
              type: 'number',
              description: 'Number of reviews',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Cart ID',
            },
            user: {
              type: 'string',
              description: 'User ID',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: {
                    type: 'object',
                    description: 'Product details',
                  },
                  quantity: {
                    type: 'number',
                    description: 'Item quantity',
                  },
                  price: {
                    type: 'number',
                    description: 'Item price',
                  },
                },
              },
            },
            totalPrice: {
              type: 'number',
              description: 'Total cart price',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Order ID',
            },
            user: {
              type: 'string',
              description: 'User ID',
            },
            orderItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                  image: { type: 'string' },
                },
              },
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' },
              },
            },
            paymentMethod: {
              type: 'string',
              enum: ['stripe', 'cash_on_delivery'],
            },
            itemsPrice: { type: 'number' },
            shippingPrice: { type: 'number' },
            taxPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            isPaid: { type: 'boolean' },
            paidAt: { type: 'string', format: 'date-time' },
            isDelivered: { type: 'boolean' },
            deliveredAt: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

