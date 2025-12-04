/**
 * JSON Schema definitions for authentication endpoints
 */

export const registerSchema = {
  body: {
    type: 'object',
    required: ['handle', 'password'],
    properties: {
      handle: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_]+$',
        description: 'User handle (3-20 alphanumeric characters and underscores)'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'Password (minimum 6 characters)'
      },
      realName: {
        type: 'string',
        maxLength: 100,
        description: 'Optional real name'
      },
      location: {
        type: 'string',
        maxLength: 100,
        description: 'Optional location'
      },
      bio: {
        type: 'string',
        maxLength: 500,
        description: 'Optional biography'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            handle: { type: 'string' },
            accessLevel: { type: 'number' },
            createdAt: { type: 'string' }
          }
        }
      }
    }
  }
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['handle', 'password'],
    properties: {
      handle: {
        type: 'string',
        minLength: 1,
        description: 'User handle'
      },
      password: {
        type: 'string',
        minLength: 1,
        description: 'User password'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            handle: { type: 'string' },
            accessLevel: { type: 'number' },
            lastLogin: { type: ['string', 'null'] },
            totalCalls: { type: 'number' }
          }
        }
      }
    }
  }
};

export const refreshTokenSchema = {
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
        minLength: 1,
        description: 'JWT token to refresh'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' }
      }
    }
  }
};

export const getMeSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        handle: { type: 'string' },
        realName: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        bio: { type: ['string', 'null'] },
        accessLevel: { type: 'number' },
        createdAt: { type: 'string' },
        lastLogin: { type: ['string', 'null'] },
        totalCalls: { type: 'number' },
        totalPosts: { type: 'number' },
        preferences: { type: 'object' }
      }
    }
  }
};
