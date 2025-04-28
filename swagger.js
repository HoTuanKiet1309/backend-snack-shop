const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Snack Shop API',
      version: '1.0.0',
      description: 'API documentation for Snack Shop',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Xác thực và phân quyền người dùng'
      },
      {
        name: 'Users',
        description: 'Quản lý thông tin người dùng'
      },
      {
        name: 'Snacks',
        description: 'Quản lý sản phẩm bánh kẹo'
      },
      {
        name: 'Categories',
        description: 'Quản lý danh mục sản phẩm'
      },
      {
        name: 'Carts',
        description: 'Quản lý giỏ hàng'
      },
      {
        name: 'Orders',
        description: 'Quản lý đơn hàng'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/api/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Create a new order from cart',
          description: 'Creates a new order using items from the user\'s cart. No request body needed - all information will be taken from user\'s cart and default address.',
          security: [{ bearerAuth: [] }],
          responses: {
            201: {
              description: 'Order created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Order created successfully'
                      },
                      order: {
                        type: 'object',
                        properties: {
                          _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                          },
                          userId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                          },
                          items: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                snackId: {
                                  type: 'string',
                                  example: '507f1f77bcf86cd799439011'
                                },
                                quantity: {
                                  type: 'number',
                                  example: 2
                                },
                                price: {
                                  type: 'number',
                                  example: 9500
                                },
                                originalPrice: {
                                  type: 'number',
                                  example: 10000
                                },
                                discount: {
                                  type: 'number',
                                  example: 5
                                },
                                subtotal: {
                                  type: 'number',
                                  example: 19000
                                }
                              }
                            }
                          },
                          totalAmount: {
                            type: 'number',
                            example: 19000
                          },
                          discount: {
                            type: 'number',
                            example: 0
                          },
                          originalAmount: {
                            type: 'number',
                            example: 20000
                          },
                          addressId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                          },
                          paymentMethod: {
                            type: 'string',
                            example: 'COD'
                          },
                          orderStatus: {
                            type: 'string',
                            example: 'pending'
                          },
                          orderDate: {
                            type: 'string',
                            format: 'date-time'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Cart is empty'
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Unauthorized'
            },
            500: {
              description: 'Internal server error'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'], // đường dẫn tới các file routes
};

const specs = swaggerJsdoc(options);

// Thêm cấu hình Swagger UI
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true, // Lưu token
    docExpansion: 'none',
    filter: true,
    deepLinking: true,
  },
};

module.exports = { specs, swaggerOptions };