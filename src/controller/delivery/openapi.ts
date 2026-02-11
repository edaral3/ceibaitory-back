export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Delivery API',
    version: '1.0.0'
  },
  servers: [
    {
      url: '/api'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          addressText: { type: 'string' },
          phone: { type: 'string' },
          mapUrl: { type: 'string', format: 'uri' },
          photoUrl: { type: 'string', format: 'uri', nullable: true },
          lat: { type: 'number', nullable: true },
          lng: { type: 'number', nullable: true },
          visitDays: {
            type: 'array',
            items: { type: 'string', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
            nullable: true
          },
          visitFrequency: {
            type: 'string',
            enum: ['weekly', 'biweekly', 'monthly', 'on_demand'],
            nullable: true
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Sale: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          eggType: { type: 'string', enum: ['caja', 'carton'] },
          eggSize: { type: 'string', nullable: true },
          unitPrice: { type: 'number', nullable: true },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                eggType: { type: 'string', enum: ['caja', 'carton'] },
                eggSize: { type: 'string' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
                lineTotal: { type: 'number' }
              }
            }
          },
          quantity: { type: 'integer', nullable: true },
          total: { type: 'number' },
          soldAt: { type: 'string', format: 'date-time' },
          payments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                paidAt: { type: 'string', format: 'date-time' },
                note: { type: 'string', nullable: true }
              }
            }
          },
          status: { type: 'string', enum: ['pending', 'paid'] },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      SaleWithClient: {
        allOf: [
          { $ref: '#/components/schemas/Sale' },
          {
            type: 'object',
            properties: {
              client: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  phone: { type: 'string' }
                }
              }
            }
          }
        ]
      },
      DeliveryVisit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          clientId: { type: 'string', format: 'uuid' },
          date: { type: 'string', pattern: '^\\\\d{4}-\\\\d{2}-\\\\d{2}$' },
          visited: { type: 'boolean' },
          visitedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          data: {},
          meta: {},
          error: {
            type: 'object',
            nullable: true,
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {}
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/clients': {
      get: {
        summary: 'List clients',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'includeDeleted', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': { description: 'OK' }
        }
      },
      post: {
        summary: 'Create client',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Client' }
            }
          }
        },
        responses: {
          '201': { description: 'Created' }
        }
      }
    },
    '/clients/{id}': {
      get: {
        summary: 'Get client',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } }
      },
      put: {
        summary: 'Update client',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Client' }
            }
          }
        },
        responses: { '200': { description: 'OK' } }
      },
      delete: {
        summary: 'Delete client',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/clients/{id}/photo': {
      post: {
        summary: 'Upload client photo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  photo: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/sales': {
      get: {
        summary: 'List sales',
        parameters: [
          { name: 'clientId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { '200': { description: 'OK' } }
      },
      post: {
        summary: 'Create sale',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Sale' }
            }
          }
        },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/sales/{id}': {
      get: {
        summary: 'Get sale',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } }
      },
      put: {
        summary: 'Update sale',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Sale' }
            }
          }
        },
        responses: { '200': { description: 'OK' } }
      },
      delete: {
        summary: 'Delete sale',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/sales/{id}/receipt': {
      get: {
        summary: 'Get delivery sale receipt (PDF)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'PDF ticket' }, '404': { description: 'Not found' } }
      }
    },
    '/delivery/cash-balance': {
      get: {
        summary: 'Get delivery cash balance',
        responses: { '200': { description: 'OK' } }
      }
    },
    '/delivery/visits': {
      get: {
        summary: 'List delivery visits by date',
        parameters: [
          { name: 'date', in: 'query', required: true, schema: { type: 'string', pattern: '^\\\\d{4}-\\\\d{2}-\\\\d{2}$' } }
        ],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/delivery/visits/today': {
      get: {
        summary: 'List delivery clients to visit for date',
        parameters: [
          { name: 'date', in: 'query', required: true, schema: { type: 'string', pattern: '^\\\\d{4}-\\\\d{2}-\\\\d{2}$' } }
        ],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/delivery/visits/assign': {
      post: {
        summary: 'Add or remove client from daily visit list',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  clientId: { type: 'string', format: 'uuid' },
                  date: { type: 'string', pattern: '^\\\\d{4}-\\\\d{2}-\\\\d{2}$' },
                  action: { type: 'string', enum: ['add', 'remove'] }
                },
                required: ['clientId', 'date', 'action']
              }
            }
          }
        },
        responses: { '200': { description: 'OK' } }
      }
    },
    '/delivery/visits/toggle': {
      post: {
        summary: 'Toggle delivery visit state',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  clientId: { type: 'string', format: 'uuid' },
                  date: { type: 'string', pattern: '^\\\\d{4}-\\\\d{2}-\\\\d{2}$' },
                  visited: { type: 'boolean' }
                },
                required: ['clientId', 'date', 'visited']
              }
            }
          }
        },
        responses: { '200': { description: 'OK' } }
      }
    }
  }
}
