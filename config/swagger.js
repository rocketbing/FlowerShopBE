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
            provider: {
              type: 'string',
              enum: ['local', 'google'],
              description: 'Authentication provider',
              example: 'local',
            },
            googleId: {
              type: 'string',
              description: 'Google user ID (for Google OAuth users)',
            },
            homeAddress: {
              type: 'object',
              description: 'User home address',
              properties: {
                firstName: {
                  type: 'string',
                  description: 'First name',
                  example: 'John',
                },
                lastName: {
                  type: 'string',
                  description: 'Last name',
                  example: 'Doe',
                },
                phoneNumber: {
                  type: 'string',
                  description: 'Phone number',
                  example: '123-456-7890',
                },
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' },
              },
              example: {
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '123-456-7890',
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
              },
            },
            shippingAddress: {
              type: 'array',
              description: 'Array of shipping addresses',
              items: {
                type: 'object',
                properties: {
                  firstName: {
                    type: 'string',
                    description: 'First name',
                    example: 'Jane',
                  },
                  lastName: {
                    type: 'string',
                    description: 'Last name',
                    example: 'Smith',
                  },
                  phoneNumber: {
                    type: 'string',
                    description: 'Phone number',
                    example: '987-654-3210',
                  },
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  country: { type: 'string' },
                },
              },
              example: [
                {
                  firstName: 'Jane',
                  lastName: 'Smith',
                  phoneNumber: '987-654-3210',
                  street: '456 Oak Ave',
                  city: 'Los Angeles',
                  state: 'CA',
                  zipCode: '90001',
                  country: 'USA',
                },
              ],
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
              example: 'Red Roses Bouquet',
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'Beautiful red roses arranged in a bouquet',
            },
            stems: {
              type: 'number',
              description: 'Number of flower stems',
              minimum: 1,
              example: 12,
            },
            color: {
              type: 'string',
              description: 'Flower color',
              example: 'red',
            },
            regularPrice: {
              type: 'number',
              description: 'Regular price of the product',
              minimum: 0,
              example: 49.99,
            },
            discountedPrice: {
              type: 'number',
              nullable: true,
              description: 'Discounted price (if on sale)',
              minimum: 0,
              example: 39.99,
            },
            quantity: {
              type: 'number',
              description: 'Product quantity per unit (isAvailable is automatically set based on quantity > 0)',
              minimum: 1,
              example: 1,
            },
            popularity: {
              type: 'number',
              description: 'Popularity rating (1-5)',
              minimum: 1,
              maximum: 5,
              example: 4,
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
              example: 'roses',
            },
            images: {
              type: 'object',
              description: 'Product image',
              properties: {
                url: {
                  type: 'string',
                  description: 'Image URL',
                  required: true,
                },
                alt: {
                  type: 'string',
                  description: 'Image alt text',
                },
              },
              required: ['url'],
            },
            isAvailable: {
              type: 'boolean',
              description: 'Product availability (automatically set based on quantity: true if quantity > 0)',
              example: true,
            },
            numReviews: {
              type: 'number',
              description: 'Number of reviews',
              minimum: 0,
              example: 25,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Product creation date',
            },
          },
          required: ['name', 'description', 'stems', 'color', 'regularPrice', 'quantity', 'category'],
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
              description: 'Shipping address for the order',
              properties: {
                firstName: {
                  type: 'string',
                  description: 'First name',
                  example: 'John',
                },
                lastName: {
                  type: 'string',
                  description: 'Last name',
                  example: 'Doe',
                },
                phoneNumber: {
                  type: 'string',
                  description: 'Phone number',
                  example: '123-456-7890',
                },
                street: {
                  type: 'string',
                  description: 'Street address',
                  example: '123 Main St',
                },
                city: {
                  type: 'string',
                  description: 'City',
                  example: 'New York',
                },
                state: {
                  type: 'string',
                  description: 'State/Province',
                  example: 'NY',
                },
                zipCode: {
                  type: 'string',
                  description: 'ZIP/Postal code',
                  example: '10001',
                },
                country: {
                  type: 'string',
                  description: 'Country',
                  example: 'USA',
                },
              },
              required: ['street', 'city', 'state', 'zipCode', 'country'],
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

